BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Tenant] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [subscriptionPlan] NVARCHAR(1000) NOT NULL CONSTRAINT [Tenant_subscriptionPlan_df] DEFAULT 'STARTER',
    [subscriptionExpiresAt] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [Tenant_isActive_df] DEFAULT 1,
    [maxQRCodes] INT NOT NULL CONSTRAINT [Tenant_maxQRCodes_df] DEFAULT 100,
    [maxUsers] INT NOT NULL CONSTRAINT [Tenant_maxUsers_df] DEFAULT 5,
    [maxProjects] INT NOT NULL CONSTRAINT [Tenant_maxProjects_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Tenant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Tenant_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [isTenantAdmin] BIT NOT NULL CONSTRAINT [User_isTenantAdmin_df] DEFAULT 0,
    [isSuperAdmin] BIT NOT NULL CONSTRAINT [User_isSuperAdmin_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [permissions] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Role_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Project_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[QRCode] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000),
    [data] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [QRCode_isActive_df] DEFAULT 1,
    [latitude] FLOAT(53),
    [longitude] FLOAT(53),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [QRCode_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [QRCode_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [QRCode_data_key] UNIQUE NONCLUSTERED ([data])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Task_status_df] DEFAULT 'PENDING',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [Task_priority_df] DEFAULT 'MEDIUM',
    [tags] NVARCHAR(max),
    [estimatedHours] FLOAT(53),
    [actualHours] FLOAT(53),
    [notes] NVARCHAR(max),
    [deadline] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Task_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [creatorId] NVARCHAR(1000) NOT NULL,
    [assigneeId] NVARCHAR(1000),
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScanLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [scannedAt] DATETIME2 NOT NULL CONSTRAINT [ScanLog_scannedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [notes] NVARCHAR(max),
    [attachments] NVARCHAR(max),
    [qrCodeId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ScanLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Subscription] (
    [id] NVARCHAR(1000) NOT NULL,
    [plan] NVARCHAR(1000) NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Subscription_status_df] DEFAULT 'ACTIVE',
    [startDate] DATETIME2 NOT NULL CONSTRAINT [Subscription_startDate_df] DEFAULT CURRENT_TIMESTAMP,
    [endDate] DATETIME2 NOT NULL,
    [autoRenew] BIT NOT NULL CONSTRAINT [Subscription_autoRenew_df] DEFAULT 1,
    [paymentMethod] NVARCHAR(1000),
    [lastPaymentDate] DATETIME2,
    [nextPaymentDate] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Subscription_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Subscription_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MasterAdmin] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [MasterAdmin_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MasterAdmin_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [MasterAdmin_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MasterAdmin_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[MasterActivityLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [details] NVARCHAR(max),
    [entity] NVARCHAR(1000),
    [entityId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MasterActivityLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [masterAdminId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [MasterActivityLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(max) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [isRead] BIT NOT NULL CONSTRAINT [Notification_isRead_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LocationLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [latitude] FLOAT(53) NOT NULL,
    [longitude] FLOAT(53) NOT NULL,
    [address] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LocationLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [LocationLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[File] (
    [id] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [size] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [File_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [File_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Workflow] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [isActive] BIT NOT NULL CONSTRAINT [Workflow_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Workflow_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [createdById] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Workflow_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowStep] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [config] NVARCHAR(max),
    [workflowId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [WorkflowStep_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowInstance] (
    [id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkflowInstance_status_df] DEFAULT 'PENDING',
    [data] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WorkflowInstance_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [workflowId] NVARCHAR(1000) NOT NULL,
    [startedById] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [WorkflowInstance_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowApproval] (
    [id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkflowApproval_status_df] DEFAULT 'PENDING',
    [comments] NVARCHAR(max),
    [approvedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WorkflowApproval_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [workflowInstanceId] NVARCHAR(1000) NOT NULL,
    [assignedToId] NVARCHAR(1000) NOT NULL,
    [approvedById] NVARCHAR(1000),
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [WorkflowApproval_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RateLimitRule] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [pattern] NVARCHAR(1000) NOT NULL,
    [method] NVARCHAR(1000),
    [limit] INT NOT NULL,
    [window] INT NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [RateLimitRule_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RateLimitRule_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [createdById] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RateLimitRule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RateLimitLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [ipAddress] NVARCHAR(1000) NOT NULL,
    [userAgent] NVARCHAR(1000),
    [requestCount] INT NOT NULL CONSTRAINT [RateLimitLog_requestCount_df] DEFAULT 1,
    [windowStart] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RateLimitLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [ruleId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [RateLimitLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaskComment] (
    [id] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskComment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [taskId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskComment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaskAttachment] (
    [id] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [size] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskAttachment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [taskId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskAttachment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaskTimeEntry] (
    [id] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [startTime] DATETIME2 NOT NULL,
    [endTime] DATETIME2,
    [duration] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskTimeEntry_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [taskId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskTimeEntry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaskTemplate] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [template] NVARCHAR(max) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [TaskTemplate_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskTemplate_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [createdById] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TaskTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ActivityLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [details] NVARCHAR(max),
    [entity] NVARCHAR(1000),
    [entityId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ActivityLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [userId] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ActivityLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tenant_subscriptionPlan_idx] ON [dbo].[Tenant]([subscriptionPlan]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tenant_isActive_idx] ON [dbo].[Tenant]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_tenantId_idx] ON [dbo].[User]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_roleId_idx] ON [dbo].[User]([roleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_tenantId_idx] ON [dbo].[Role]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_name_idx] ON [dbo].[Role]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Project_tenantId_idx] ON [dbo].[Project]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Project_name_idx] ON [dbo].[Project]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QRCode_projectId_idx] ON [dbo].[QRCode]([projectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QRCode_tenantId_idx] ON [dbo].[QRCode]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QRCode_isActive_idx] ON [dbo].[QRCode]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QRCode_data_idx] ON [dbo].[QRCode]([data]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_projectId_idx] ON [dbo].[Task]([projectId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_creatorId_idx] ON [dbo].[Task]([creatorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_assigneeId_idx] ON [dbo].[Task]([assigneeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_tenantId_idx] ON [dbo].[Task]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_status_idx] ON [dbo].[Task]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_priority_idx] ON [dbo].[Task]([priority]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_deadline_idx] ON [dbo].[Task]([deadline]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScanLog_qrCodeId_idx] ON [dbo].[ScanLog]([qrCodeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScanLog_userId_idx] ON [dbo].[ScanLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScanLog_tenantId_idx] ON [dbo].[ScanLog]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScanLog_scannedAt_idx] ON [dbo].[ScanLog]([scannedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Subscription_tenantId_idx] ON [dbo].[Subscription]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Subscription_status_idx] ON [dbo].[Subscription]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Subscription_endDate_idx] ON [dbo].[Subscription]([endDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterAdmin_email_idx] ON [dbo].[MasterAdmin]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterAdmin_isActive_idx] ON [dbo].[MasterAdmin]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterActivityLog_masterAdminId_idx] ON [dbo].[MasterActivityLog]([masterAdminId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterActivityLog_createdAt_idx] ON [dbo].[MasterActivityLog]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterActivityLog_entity_idx] ON [dbo].[MasterActivityLog]([entity]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MasterActivityLog_action_idx] ON [dbo].[MasterActivityLog]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_tenantId_idx] ON [dbo].[Notification]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_userId_idx] ON [dbo].[Notification]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_isRead_idx] ON [dbo].[Notification]([isRead]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_createdAt_idx] ON [dbo].[Notification]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LocationLog_tenantId_idx] ON [dbo].[LocationLog]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LocationLog_userId_idx] ON [dbo].[LocationLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LocationLog_createdAt_idx] ON [dbo].[LocationLog]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [File_tenantId_idx] ON [dbo].[File]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [File_userId_idx] ON [dbo].[File]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [File_createdAt_idx] ON [dbo].[File]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Workflow_tenantId_idx] ON [dbo].[Workflow]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Workflow_createdById_idx] ON [dbo].[Workflow]([createdById]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Workflow_isActive_idx] ON [dbo].[Workflow]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowStep_workflowId_idx] ON [dbo].[WorkflowStep]([workflowId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowStep_order_idx] ON [dbo].[WorkflowStep]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowInstance_workflowId_idx] ON [dbo].[WorkflowInstance]([workflowId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowInstance_startedById_idx] ON [dbo].[WorkflowInstance]([startedById]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowInstance_tenantId_idx] ON [dbo].[WorkflowInstance]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowInstance_status_idx] ON [dbo].[WorkflowInstance]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowInstance_createdAt_idx] ON [dbo].[WorkflowInstance]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowApproval_workflowInstanceId_idx] ON [dbo].[WorkflowApproval]([workflowInstanceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowApproval_assignedToId_idx] ON [dbo].[WorkflowApproval]([assignedToId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowApproval_approvedById_idx] ON [dbo].[WorkflowApproval]([approvedById]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowApproval_tenantId_idx] ON [dbo].[WorkflowApproval]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowApproval_status_idx] ON [dbo].[WorkflowApproval]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitRule_tenantId_idx] ON [dbo].[RateLimitRule]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitRule_createdById_idx] ON [dbo].[RateLimitRule]([createdById]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitRule_isActive_idx] ON [dbo].[RateLimitRule]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitRule_pattern_idx] ON [dbo].[RateLimitRule]([pattern]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitLog_tenantId_idx] ON [dbo].[RateLimitLog]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitLog_userId_idx] ON [dbo].[RateLimitLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitLog_ruleId_idx] ON [dbo].[RateLimitLog]([ruleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitLog_ipAddress_idx] ON [dbo].[RateLimitLog]([ipAddress]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimitLog_windowStart_idx] ON [dbo].[RateLimitLog]([windowStart]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskComment_taskId_idx] ON [dbo].[TaskComment]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskComment_userId_idx] ON [dbo].[TaskComment]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskComment_tenantId_idx] ON [dbo].[TaskComment]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskComment_createdAt_idx] ON [dbo].[TaskComment]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAttachment_taskId_idx] ON [dbo].[TaskAttachment]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAttachment_userId_idx] ON [dbo].[TaskAttachment]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAttachment_tenantId_idx] ON [dbo].[TaskAttachment]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAttachment_createdAt_idx] ON [dbo].[TaskAttachment]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTimeEntry_taskId_idx] ON [dbo].[TaskTimeEntry]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTimeEntry_userId_idx] ON [dbo].[TaskTimeEntry]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTimeEntry_tenantId_idx] ON [dbo].[TaskTimeEntry]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTimeEntry_startTime_idx] ON [dbo].[TaskTimeEntry]([startTime]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTemplate_tenantId_idx] ON [dbo].[TaskTemplate]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTemplate_createdById_idx] ON [dbo].[TaskTemplate]([createdById]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTemplate_isActive_idx] ON [dbo].[TaskTemplate]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_userId_idx] ON [dbo].[ActivityLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_tenantId_idx] ON [dbo].[ActivityLog]([tenantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_createdAt_idx] ON [dbo].[ActivityLog]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_entity_idx] ON [dbo].[ActivityLog]([entity]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_action_idx] ON [dbo].[ActivityLog]([action]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QRCode] ADD CONSTRAINT [QRCode_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QRCode] ADD CONSTRAINT [QRCode_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_creatorId_fkey] FOREIGN KEY ([creatorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScanLog] ADD CONSTRAINT [ScanLog_qrCodeId_fkey] FOREIGN KEY ([qrCodeId]) REFERENCES [dbo].[QRCode]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ScanLog] ADD CONSTRAINT [ScanLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScanLog] ADD CONSTRAINT [ScanLog_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Subscription] ADD CONSTRAINT [Subscription_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MasterActivityLog] ADD CONSTRAINT [MasterActivityLog_masterAdminId_fkey] FOREIGN KEY ([masterAdminId]) REFERENCES [dbo].[MasterAdmin]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LocationLog] ADD CONSTRAINT [LocationLog_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LocationLog] ADD CONSTRAINT [LocationLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[File] ADD CONSTRAINT [File_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[File] ADD CONSTRAINT [File_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Workflow] ADD CONSTRAINT [Workflow_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Workflow] ADD CONSTRAINT [Workflow_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowStep] ADD CONSTRAINT [WorkflowStep_workflowId_fkey] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflow]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowInstance] ADD CONSTRAINT [WorkflowInstance_workflowId_fkey] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflow]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowInstance] ADD CONSTRAINT [WorkflowInstance_startedById_fkey] FOREIGN KEY ([startedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowInstance] ADD CONSTRAINT [WorkflowInstance_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_workflowInstanceId_fkey] FOREIGN KEY ([workflowInstanceId]) REFERENCES [dbo].[WorkflowInstance]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_assignedToId_fkey] FOREIGN KEY ([assignedToId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_approvedById_fkey] FOREIGN KEY ([approvedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitRule] ADD CONSTRAINT [RateLimitRule_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitRule] ADD CONSTRAINT [RateLimitRule_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitLog] ADD CONSTRAINT [RateLimitLog_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitLog] ADD CONSTRAINT [RateLimitLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitLog] ADD CONSTRAINT [RateLimitLog_ruleId_fkey] FOREIGN KEY ([ruleId]) REFERENCES [dbo].[RateLimitRule]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskComment] ADD CONSTRAINT [TaskComment_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskComment] ADD CONSTRAINT [TaskComment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskComment] ADD CONSTRAINT [TaskComment_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskAttachment] ADD CONSTRAINT [TaskAttachment_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskAttachment] ADD CONSTRAINT [TaskAttachment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskAttachment] ADD CONSTRAINT [TaskAttachment_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTimeEntry] ADD CONSTRAINT [TaskTimeEntry_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTimeEntry] ADD CONSTRAINT [TaskTimeEntry_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTimeEntry] ADD CONSTRAINT [TaskTimeEntry_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTemplate] ADD CONSTRAINT [TaskTemplate_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTemplate] ADD CONSTRAINT [TaskTemplate_createdById_fkey] FOREIGN KEY ([createdById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLog] ADD CONSTRAINT [ActivityLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLog] ADD CONSTRAINT [ActivityLog_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
