# 需求功能说明

目标：帮助需求发布者公开开发需求，帮助开发者通过站内响应参与合作。

字段：标题、描述、需求类型、技术栈、预算范围、期望完成时间、响应方式、发布者、状态和响应人数。

状态：草稿 -> 招募中 -> 沟通中 -> 已完成；发布者也可以关闭需求。

接口：GET /api/v1/requirements、POST /api/v1/requirements、GET /api/v1/requirements/:id、PATCH /api/v1/requirements/:id、POST /api/v1/requirements/:id/responses、POST /api/v1/requirements/:id/close。

规则：登录用户才可发布和响应；发布者不能响应自己的需求；同一用户对同一需求只能提交一次有效响应；首版不处理支付和担保交易。验收：支持类型、技术栈、预算、时间和状态筛选，发布者可查看响应者并更新状态。

