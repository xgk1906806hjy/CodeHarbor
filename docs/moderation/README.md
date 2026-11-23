# 内容审核功能说明

目标：保障社区内容质量，处理用户举报、违规内容和管理员审核动作。

范围：博客、工具、需求、评论和用户举报；支持待审核、通过、下架、恢复和驳回。

接口：POST /api/v1/reports、GET /api/v1/admin/reports、POST /api/v1/admin/moderation/:id/approve、POST /api/v1/admin/moderation/:id/reject、POST /api/v1/admin/moderation/:id/hide、POST /api/v1/admin/moderation/:id/restore。

规则：管理员操作记录操作人、时间、对象、原状态、新状态和备注；普通用户看不到下架内容；作者可以看到处理状态和原因摘要。验收：用户可举报；管理员可按状态和类型处理；下架和恢复影响公开列表和详情。

