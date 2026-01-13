const GLOBAL_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://aegism.online';

document.addEventListener('alpine:init', () => {

    // --- STORE QUẢN LÝ TOÀN BỘ HỆ THỐNG GỌI & THÔNG BÁO ---
    Alpine.store('globalNotify', {
        // State Thông báo
        toasts: [],

        // State Hệ thống
        socket: null,
        user: null,
        token: null,

        // WebRTC State
        incomingCall: null,
        isInCall: false,
        peerConnection: null,
        localStream: null,
        remoteStream: null,

        // Media State
        isMicOn: true,
        isCamOn: true,
        isRemoteCamOn: true,

        callStatus: 'Đang kết nối...',
        callDuration: 0,
        callTimer: null,

        // Queue xử lý mạng
        remoteCandidatesQueue: [],

        // Thông tin người bên kia đầu dây
        remoteUser: { name: '', avatar: '' },

        // Audio
        sounds: {
            notification: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3'),
            ringtone: new Audio('/sound/bell.mp3'),
            waiting: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-waiting-ringtone-1354.mp3')
        },

        init() {
            const userStr = localStorage.getItem('user');
            const tokenStr = localStorage.getItem('accessToken');
            if (!userStr || !tokenStr) return;

            this.user = JSON.parse(userStr);
            this.token = tokenStr;

            this.sounds.ringtone.loop = true;
            this.sounds.waiting.loop = true;

            this.connectSocket();
        },

        // [HELPER] Hàm lấy Avatar thông minh
        getAvatar(user) {
            if (user && user.avatar && !user.avatar.includes('ui-avatars.com')) return user.avatar;
            const name = user?.name || user?.fullName || this.remoteUser.name || 'User';
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128&font-size=0.33`;
        },

        connectSocket() {
            if (this.socket) return;

            try {
                this.socket = io(GLOBAL_API_URL, {
                    query: { token: this.token },
                    transports: ['websocket']
                });

                this.socket.on('connect', () => console.log('Global Socket Connected'));

                // --- 1. XỬ LÝ TIN NHẮN & THÔNG BÁO ---
                this.socket.on('newMessage', (msg) => {
                    if (msg.senderId !== this.user.id) {
                        this.playSound('notification');

                        if (window.location.href.includes('chat.html')) return;

                        let content = msg.content;
                        let type = 'message';

                        if (msg.type === 'IMAGE') content = '[Hình ảnh]';
                        else if (msg.type === 'FILE') content = '[Tệp tin]';
                        else if (msg.type === 'CALL_LOG') {
                            content = msg.content;
                            type = 'call';
                        }

                        this.addToast(
                            msg.sender.fullName,
                            content,
                            this.getAvatar(msg.sender),
                            type
                        );
                    }
                });


                this.socket.on('call-made', async (data) => {
                    if (this.isInCall) {
                        this.socket.emit('call-busy', { toUser: data.fromUserId });
                        return;
                    }
                    console.log("📞 Incoming Call:", data);
                    this.incomingCall = data;

                    this.playSound('ringtone');
                });

                this.socket.on('user-busy', () => {
                    this.addToast('Người nhận đang bận', 'Người dùng đang trong cuộc gọi khác.', null, 'warning');
                    this.stopSound('waiting');
                    this.endCall(false, 'BUSY', false);
                });

                this.socket.on('answer-made', async (data) => {
                    console.log("📞 Call Answered");
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                    await this.processBufferedCandidates();
                    this.callStatus = 'Đã kết nối';
                    this.stopSound('waiting');
                    this.startTimer();
                });

                this.socket.on('ice-candidate', async (data) => {
                    const candidate = new RTCIceCandidate(data.candidate);
                    if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                        await this.peerConnection.addIceCandidate(candidate);
                    } else {
                        this.remoteCandidatesQueue.push(candidate);
                    }
                });

                this.socket.on('remote-camera-toggled', (status) => {
                    this.isRemoteCamOn = status;
                });

                this.socket.on('call-ended', () => {
                    this.endCall(true);
                });

            } catch (e) { console.warn("Socket Error:", e); }
        },

        async processBufferedCandidates() {
            if (this.remoteCandidatesQueue.length > 0) {
                for (const candidate of this.remoteCandidatesQueue) {
                    try { await this.peerConnection.addIceCandidate(candidate); } catch (e) { }
                }
                this.remoteCandidatesQueue = [];
            }
        },

        // === GỌI ĐI ===
        async makeCall(targetUserId, targetName, targetAvatar, isVideo = true) {
            this.isInCall = true;
            this.callStatus = 'Đang gọi...';

            this.remoteUser = {
                name: targetName || 'Người dùng',
                avatar: this.getAvatar({ fullName: targetName, avatar: targetAvatar })
            };

            this.isCamOn = isVideo;
            this.isRemoteCamOn = true;
            this.isMicOn = true;

            this.playSound('waiting');
            await this.setupLocalMedia();
            this.createPeerConnection(targetUserId);

            if (this.localStream) {
                this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
            }

            try {
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);

                this.socket.emit('call-user', {
                    userToCall: targetUserId,
                    signalData: offer,
                    fromUser: this.user,
                    isVideoCall: isVideo
                });

                this.callTimeout = setTimeout(() => {
                    if (this.peerConnection.connectionState !== 'connected') {
                        this.endCall(false, 'MISSED', true);
                        this.addToast('Thông báo', 'Người nhận không trả lời', null, 'warning');
                    }
                }, 30000);

            } catch (e) {
                this.endCall();
            }
        },

        // === NHẬN CUỘC GỌI ===
        async acceptCall() {
            const data = this.incomingCall;
            this.incomingCall = null;
            this.stopSound('ringtone');

            this.isInCall = true;
            this.callStatus = 'Đang kết nối...';

            this.remoteUser = {
                name: data.fromUserName,
                avatar: this.getAvatar({ fullName: data.fromUserName, avatar: data.fromUserAvatar })
            };

            const isVideo = data.isVideoCall || false;
            this.isCamOn = isVideo;
            this.isRemoteCamOn = isVideo;

            await this.setupLocalMedia();
            this.createPeerConnection(data.fromUserId);

            if (this.localStream) {
                this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));
            }

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            await this.processBufferedCandidates();

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.socket.emit('make-answer', {
                signal: answer,
                toUser: data.fromUserId
            });

            if (!isVideo) {
                this.socket.emit('toggle-camera', { toUser: data.fromUserId, status: false });
            }

            this.startTimer();
        },

        rejectCall() {
            if (this.incomingCall) {
                this.socket.emit('end-call', {
                    toUser: this.incomingCall.fromUserId,
                    status: 'REJECTED',
                    conversationId: null
                });
            }
            this.incomingCall = null;
            this.stopSound('ringtone');
        },

        endCall(isRemote = false, statusOverride = null, sendSignal = true) {
            this.stopSound('ringtone');
            this.stopSound('waiting');
            this.stopTimer();

            this.isInCall = false;
            this.incomingCall = null;
            this.callDuration = 0;
            this.remoteStream = null;
            this.remoteCandidatesQueue = [];

            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            const localVid = document.getElementById('globalLocalVideo');
            const remoteVid = document.getElementById('globalRemoteVideo');
            if (localVid) localVid.srcObject = null;
            if (remoteVid) remoteVid.srcObject = null;
        },

        async setupLocalMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: this.isCamOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
                    audio: true
                });
                this.localStream = stream;
                const localVid = document.getElementById('globalLocalVideo');
                if (localVid) localVid.srcObject = stream;
            } catch (err) {
                this.addToast('Lỗi', 'Không thể truy cập thiết bị', null, 'error');
                this.endCall();
            }
        },

        createPeerConnection(targetUserId) {
            const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
            this.peerConnection = new RTCPeerConnection(config);

            this.peerConnection.onconnectionstatechange = () => {
                switch (this.peerConnection.connectionState) {
                    case 'connected':
                        this.callStatus = 'Đã kết nối';
                        this.stopSound('waiting');
                        this.startTimer();
                        break;
                    case 'disconnected':
                    case 'failed':
                    case 'closed':
                        this.callStatus = 'Kết thúc';
                        this.endCall();
                        break;
                }
            };

            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        candidate: event.candidate,
                        toUser: targetUserId
                    });
                }
            };

            this.peerConnection.ontrack = (event) => {
                const remoteVid = document.getElementById('globalRemoteVideo');
                if (remoteVid) {
                    this.remoteStream = event.streams[0] || new MediaStream([event.track]);
                    remoteVid.srcObject = this.remoteStream;
                }
            };
        },

        toggleMic() {
            this.isMicOn = !this.isMicOn;
            if (this.localStream) this.localStream.getAudioTracks()[0].enabled = this.isMicOn;
        },
        toggleCamera() {
            this.isCamOn = !this.isCamOn;
            if (this.localStream && this.localStream.getVideoTracks().length > 0) {
                this.localStream.getVideoTracks()[0].enabled = this.isCamOn;
            }
        },
        startTimer() {
            if (this.callTimer) clearInterval(this.callTimer);
            this.callDuration = 0;
            this.callTimer = setInterval(() => { this.callDuration++; }, 1000);
        },
        stopTimer() { clearInterval(this.callTimer); this.callTimer = null; },
        formatDuration() {
            const m = Math.floor(this.callDuration / 60).toString().padStart(2, '0');
            const s = (this.callDuration % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        },
        // [UPDATE] Hàm playSound chắc chắn hơn
        playSound(name) {
            const sound = this.sounds[name];
            if (sound) {
                sound.currentTime = 0; // Tua lại từ đầu
                sound.play().catch(e => console.log("Không thể phát âm thanh:", e));
            }
        },
        stopSound(name) {
            const sound = this.sounds[name];
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        },
        addToast(title, msg, avatar, type = 'message') {
            const id = Date.now();
            this.toasts.push({ id, title, msg, avatar, type, visible: true });
            setTimeout(() => { this.removeToast(id); }, 5000);
        },
        removeToast(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
        clickToast() { window.location.href = '/ternants/chat.html'; }
    });
});

// INJECT GLOBAL UI (Giữ nguyên giao diện)
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('global-ui-container')) return;

    const globalHTML = `
    <div id="global-ui-container" x-data>
        <!-- TOASTS -->
        <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <template x-for="toast in $store.globalNotify.toasts" :key="toast.id">
                <div @click="$store.globalNotify.clickToast()" x-show="toast.visible" x-transition class="bg-white/90 backdrop-blur border p-3 pr-5 rounded-2xl shadow-xl flex items-center gap-4 min-w-[320px] pointer-events-auto cursor-pointer border-l-4" :class="toast.type === 'call' ? 'border-l-red-500' : 'border-l-blue-500'">
                    <div class="shrink-0">
                        <img :src="toast.avatar" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-sm text-gray-800" x-text="toast.title"></h4>
                        <p class="text-xs text-gray-500 truncate" x-text="toast.msg"></p>
                    </div>
                </div>
            </template>
        </div>

        <!-- INCOMING CALL POPUP -->
        <div x-show="$store.globalNotify.incomingCall" x-transition class="fixed top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl text-gray-800 p-4 pr-6 rounded-full shadow-2xl z-[10000] flex items-center gap-5 min-w-[360px] border border-white/50">
            <div class="relative">
                <div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>
                <img :src="$store.globalNotify.getAvatar({fullName: $store.globalNotify.incomingCall?.fromUserName, avatar: $store.globalNotify.incomingCall?.fromUserAvatar})" class="w-16 h-16 rounded-full border-4 border-white relative z-10 shadow-sm">
            </div>
            <div class="flex-1">
                <p class="text-[10px] font-bold text-green-600 uppercase tracking-widest animate-pulse" x-text="$store.globalNotify.incomingCall?.isVideoCall ? 'VIDEO CALL...' : 'INCOMING CALL...'"></p>
                <p class="font-bold text-lg truncate max-w-[150px]" x-text="$store.globalNotify.incomingCall?.fromUserName"></p>
            </div>
            <div class="flex gap-3">
                <button @click="$store.globalNotify.rejectCall()" class="w-12 h-12 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-phone-slash"></i></button>
                <button @click="$store.globalNotify.acceptCall()" class="w-12 h-12 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center animate-bounce shadow-lg shadow-green-500/30"><i class="fas fa-phone"></i></button>
            </div>
        </div>

        <!-- ACTIVE CALL SCREEN -->
        <div x-show="$store.globalNotify.isInCall" class="fixed inset-0 bg-slate-900 z-[10001] flex flex-col animate-pop" x-cloak>
            <div class="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                <video id="globalRemoteVideo" class="w-full h-full object-cover" autoplay playsinline x-show="$store.globalNotify.isRemoteCamOn"></video>
                <div x-show="!$store.globalNotify.isRemoteCamOn" class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-white z-10">
                    <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.3)] mb-6 relative">
                        <img :src="$store.globalNotify.remoteUser.avatar" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight" x-text="$store.globalNotify.remoteUser.name"></h2>
                    <p class="text-slate-400 text-sm mt-2 font-mono" x-text="$store.globalNotify.formatDuration()"></p>
                </div>
                <video id="globalLocalVideo" class="absolute bottom-28 right-6 w-40 h-28 object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-20 hover:scale-110 transition-transform cursor-pointer" style="transform: scaleX(-1);" autoplay playsinline muted x-show="$store.globalNotify.isCamOn"></video>
                <div x-show="!$store.globalNotify.isCamOn" class="absolute bottom-28 right-6 w-40 h-28 rounded-2xl border-2 border-white/10 bg-slate-800 shadow-2xl z-20 flex items-center justify-center">
                    <img :src="$store.globalNotify.getAvatar($store.globalNotify.user)" class="w-12 h-12 rounded-full object-cover opacity-80">
                    <div class="absolute bottom-1 right-1 bg-red-500 rounded-full p-1"><i class="fas fa-video-slash text-[10px] text-white"></i></div>
                </div>
                <div class="absolute top-8 left-8 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-4 z-30">
                    <div class="w-2 h-2 rounded-full" :class="$store.globalNotify.callStatus === 'Đã kết nối' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'"></div>
                    <span class="text-white font-bold text-sm" x-text="$store.globalNotify.callStatus"></span>
                    <span class="text-white/80 font-mono text-sm border-l border-white/20 pl-4" x-show="$store.globalNotify.callDuration > 0" x-text="$store.globalNotify.formatDuration()"></span>
                </div>
                <div class="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-full flex gap-4 shadow-2xl z-30">
                    <button @click="$store.globalNotify.toggleMic()" class="w-14 h-14 rounded-full flex items-center justify-center transition-all" :class="$store.globalNotify.isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-red-600'"><i class="fas text-xl" :class="$store.globalNotify.isMicOn ? 'fa-microphone' : 'fa-microphone-slash'"></i></button>
                    <button @click="$store.globalNotify.toggleCamera()" class="w-14 h-14 rounded-full flex items-center justify-center transition-all" :class="$store.globalNotify.isCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-red-600'"><i class="fas text-xl" :class="$store.globalNotify.isCamOn ? 'fa-video' : 'fa-video-slash'"></i></button>
                    <div class="w-px h-8 bg-white/10 my-auto mx-2"></div>
                    <button @click="$store.globalNotify.endCall()" class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transform hover:scale-105 transition"><i class="fas fa-phone-slash text-2xl"></i></button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', globalHTML);
    if (window.Alpine) { }
});