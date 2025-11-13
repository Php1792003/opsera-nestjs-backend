BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[File] DROP CONSTRAINT [File_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[LocationLog] DROP CONSTRAINT [LocationLog_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[RateLimitRule] DROP CONSTRAINT [RateLimitRule_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Role] DROP CONSTRAINT [Role_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[TaskTemplate] DROP CONSTRAINT [TaskTemplate_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Workflow] DROP CONSTRAINT [Workflow_tenantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[WorkflowInstance] DROP CONSTRAINT [WorkflowInstance_workflowId_fkey];

-- DropIndex
DROP INDEX [ActivityLog_action_idx] ON [dbo].[ActivityLog];

-- DropIndex
DROP INDEX [ActivityLog_createdAt_idx] ON [dbo].[ActivityLog];

-- DropIndex
DROP INDEX [ActivityLog_entity_idx] ON [dbo].[ActivityLog];

-- DropIndex
DROP INDEX [File_createdAt_idx] ON [dbo].[File];

-- DropIndex
DROP INDEX [LocationLog_createdAt_idx] ON [dbo].[LocationLog];

-- DropIndex
DROP INDEX [MasterActivityLog_action_idx] ON [dbo].[MasterActivityLog];

-- DropIndex
DROP INDEX [MasterActivityLog_createdAt_idx] ON [dbo].[MasterActivityLog];

-- DropIndex
DROP INDEX [MasterActivityLog_entity_idx] ON [dbo].[MasterActivityLog];

-- DropIndex
DROP INDEX [MasterAdmin_email_idx] ON [dbo].[MasterAdmin];

-- DropIndex
DROP INDEX [MasterAdmin_isActive_idx] ON [dbo].[MasterAdmin];

-- DropIndex
DROP INDEX [Notification_createdAt_idx] ON [dbo].[Notification];

-- DropIndex
DROP INDEX [Notification_isRead_idx] ON [dbo].[Notification];

-- DropIndex
DROP INDEX [QRCode_data_idx] ON [dbo].[QRCode];

-- DropIndex
DROP INDEX [QRCode_isActive_idx] ON [dbo].[QRCode];

-- DropIndex
DROP INDEX [RateLimitLog_ipAddress_idx] ON [dbo].[RateLimitLog];

-- DropIndex
DROP INDEX [RateLimitLog_ruleId_idx] ON [dbo].[RateLimitLog];

-- DropIndex
DROP INDEX [RateLimitLog_windowStart_idx] ON [dbo].[RateLimitLog];

-- DropIndex
DROP INDEX [RateLimitRule_createdById_idx] ON [dbo].[RateLimitRule];

-- DropIndex
DROP INDEX [RateLimitRule_isActive_idx] ON [dbo].[RateLimitRule];

-- DropIndex
DROP INDEX [RateLimitRule_pattern_idx] ON [dbo].[RateLimitRule];

-- DropIndex
DROP INDEX [ScanLog_scannedAt_idx] ON [dbo].[ScanLog];

-- DropIndex
DROP INDEX [ScanLog_tenantId_idx] ON [dbo].[ScanLog];

-- DropIndex
DROP INDEX [Subscription_endDate_idx] ON [dbo].[Subscription];

-- DropIndex
DROP INDEX [Task_deadline_idx] ON [dbo].[Task];

-- DropIndex
DROP INDEX [Task_priority_idx] ON [dbo].[Task];

-- DropIndex
DROP INDEX [Task_status_idx] ON [dbo].[Task];

-- DropIndex
DROP INDEX [TaskAttachment_createdAt_idx] ON [dbo].[TaskAttachment];

-- DropIndex
DROP INDEX [TaskAttachment_tenantId_idx] ON [dbo].[TaskAttachment];

-- DropIndex
DROP INDEX [TaskComment_createdAt_idx] ON [dbo].[TaskComment];

-- DropIndex
DROP INDEX [TaskComment_tenantId_idx] ON [dbo].[TaskComment];

-- DropIndex
DROP INDEX [TaskTemplate_createdById_idx] ON [dbo].[TaskTemplate];

-- DropIndex
DROP INDEX [TaskTemplate_isActive_idx] ON [dbo].[TaskTemplate];

-- DropIndex
DROP INDEX [TaskTimeEntry_startTime_idx] ON [dbo].[TaskTimeEntry];

-- DropIndex
DROP INDEX [TaskTimeEntry_tenantId_idx] ON [dbo].[TaskTimeEntry];

-- DropIndex
DROP INDEX [Workflow_isActive_idx] ON [dbo].[Workflow];

-- DropIndex
DROP INDEX [WorkflowApproval_approvedById_idx] ON [dbo].[WorkflowApproval];

-- DropIndex
DROP INDEX [WorkflowApproval_status_idx] ON [dbo].[WorkflowApproval];

-- DropIndex
DROP INDEX [WorkflowApproval_tenantId_idx] ON [dbo].[WorkflowApproval];

-- DropIndex
DROP INDEX [WorkflowInstance_createdAt_idx] ON [dbo].[WorkflowInstance];

-- DropIndex
DROP INDEX [WorkflowInstance_status_idx] ON [dbo].[WorkflowInstance];

-- DropIndex
DROP INDEX [WorkflowStep_order_idx] ON [dbo].[WorkflowStep];

-- AlterTable
ALTER TABLE [dbo].[Role] ADD [projectId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[ProjectMember] (
    [userId] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [ProjectMember_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjectMember_pkey] PRIMARY KEY CLUSTERED ([userId],[projectId])
);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectMember] ADD CONSTRAINT [ProjectMember_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectMember] ADD CONSTRAINT [ProjectMember_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LocationLog] ADD CONSTRAINT [LocationLog_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[File] ADD CONSTRAINT [File_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Workflow] ADD CONSTRAINT [Workflow_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowInstance] ADD CONSTRAINT [WorkflowInstance_workflowId_fkey] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflow]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RateLimitRule] ADD CONSTRAINT [RateLimitRule_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTemplate] ADD CONSTRAINT [TaskTemplate_tenantId_fkey] FOREIGN KEY ([tenantId]) REFERENCES [dbo].[Tenant]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
