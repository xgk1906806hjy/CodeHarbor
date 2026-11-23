# 用户互动功能说明

范围：点赞、收藏、评论、关注和站内通知。

规则：点赞、收藏和关注关系唯一，重复请求返回当前状态；评论首版只支持一级评论；评论正文做长度和安全校验；被点赞、评论、关注或需求响应时创建通知；用户只能删除自己的评论，管理员可以隐藏违规评论。

接口：POST /api/v1/interactions/likes、POST /api/v1/interactions/favorites、POST /api/v1/interactions/follows、GET /api/v1/comments、POST /api/v1/comments、GET /api/v1/notifications、POST /api/v1/notifications/:id/read。

验收：重复点击不产生重复关系；刷新后互动状态和计数一致；通知显示来源、类型、时间和跳转目标。

