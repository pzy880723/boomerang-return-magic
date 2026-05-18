## 目标
在游客版识物结果页，删除「市场参考价」字段的显示（不再渲染 `marketValue` 相关 UI）。

## 改动范围
仅前端展示层，不动后端/识别逻辑、不动类型定义、不动数据库。

### 文件：`src/components/recognition/GuestProductCard.tsx`

`ValuationHero` 组件中：

1. 删除整块「市场参考价」展示：
   - 标题行 `<TrendingUp /> 市场参考价`
   - 大字号金额 `{marketValue}` 或占位 `—`
   - 小字 `来源公开二手市场估算 · 非本店售价`

2. 调整布局：原本是 `grid grid-cols-1 sm:grid-cols-[1.3fr_1fr]`（左侧价格、右侧稀缺度），删除左列后改为单列，稀缺度移到左侧、去掉 `sm:border-l sm:pl-5` 分隔。

3. `hasAny` 判定中移除 `marketValue`，仅根据 `rarity / buyReason / era / origin` 判断是否渲染。

4. `ValuationHero` 的 props 中移除 `marketValue`，调用处（`<ValuationHero ...>`）同步去掉 `marketValue={...}`。

底部 meta、故事、看点、欣赏、保养等区块保持不变。`buyReason`（推荐理由）、稀缺度星级、年代、产地继续保留。

## 不改动
- `useGuestRecognition.tsx` 中 `marketValue` 字段仍正常接收（后端返回不变，只是不显示），避免影响缓存/历史数据结构。
- `RecognitionResult` 类型不动。
- 主播端 / 其他卡片不动。
