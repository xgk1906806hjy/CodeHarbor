# 博客功能说明

目标：支持开发者以 Markdown 形式创作、发布、阅读和维护技术文章。

字段：标题、摘要、正文、封面、分类、标签、作者、状态、发布时间、阅读数、点赞数、收藏数、评论数。

流程：新建草稿 -> 编辑预览 -> 保存或发布 -> 公开阅读 -> 作者编辑删除或管理员下架。

接口：GET /api/v1/blogs、POST /api/v1/blogs、GET /api/v1/blogs/:id、PATCH /api/v1/blogs/:id、DELETE /api/v1/blogs/:id、POST /api/v1/blogs/:id/publish。

规则：标题、正文和分类必填；标题建议不超过 80 字；Markdown 使用安全白名单；公开列表只返回已发布内容。验收：支持分页、分类、标签、热度排序；详情显示作者、目录、相关文章和评论入口。

