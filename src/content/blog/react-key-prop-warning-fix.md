---
title: 'React Warning: Each child in a list should have a unique key prop'
description: 'key 누락·index key·중복 key로 생기는 리스트 렌더 버그 해결'
pubDate: 2026-07-02
category: react
tags: ['react', 'warning', 'lists']
---

리스트를 `map`으로 그릴 때 콘솔에 이 경고가 뜹니다.

```
Warning: Each child in a list should have a unique "key" prop.
```

key는 React가 **어떤 항목이 바뀌었는지** 구분하는 힌트입니다. 없거나 잘못되면 입력 포커스가 날아가고, 불필요한 리렌더·상태 꼬임이 생깁니다.

## 잘못된 예

```tsx
{items.map((item) => (
  <li>{item.name}</li>  // key 없음
))}
```

```tsx
{items.map((item, index) => (
  <input key={index} defaultValue={item.name} />  // index key — 순서 바뀌면 버그
))}
```

## 올바른 예: 안정적인 ID

```tsx
{items.map((item) => (
  <li key={item.id}>{item.name}</li>
))}
```

DB id, UUID, slug처럼 **항목마다 고유하고 변하지 않는 값**이 좋습니다.

## id가 없을 때

```tsx
const itemsWithKey = items.map((item) => ({
  ...item,
  _key: item.sku ?? `${item.category}-${item.name}`,
}));

{itemsWithKey.map((item) => (
  <Row key={item._key} item={item} />
))}
```

임시 key를 만들되, **정렬·필터 후에도 같은 항목이 같은 key**를 갖게 하세요.

## index key를 써도 되는 경우

- 리스트가 **정적**이고 순서·삭제·삽입이 없음
- 항목에 local state가 없음 (순수 표시)

그 외에는 index key를 피하는 편이 안전합니다.

## Fragment에 key

```tsx
{pairs.map(([a, b]) => (
  <Fragment key={a.id}>
    <dt>{a.label}</dt>
    <dd>{b.value}</dd>
  </Fragment>
))}
```

형제 여러 노드를 묶을 때는 `<>...</>` 대신 `<Fragment key={...}>`.

## key를 컴포넌트 안에 넣으면 안 됨

```tsx
// ❌
function Row({ item }) {
  return <tr key={item.id}>...</tr>;
}
{items.map((item) => <Row item={item} />)}

// ✅
{items.map((item) => (
  <Row key={item.id} item={item} />
))}
```

key는 **map을 호출하는 쪽**에 붙입니다.

## 증상별 연결

| 증상 | key 문제 |
| --- | --- |
| 정렬 후 입력값 뒤섞임 | index key |
| 삭제 시 잘못된 행이 사라짐 | index key |
| 경고만 뜨고 동작은 함 | key 누락 (곧 버그) |
| 두 항목이 같은 key | duplicate key |

## 마무리

key는 성능 최적화 장식이 아니라 **리스트 정합성**을 위한 필수값입니다. `id` → `sku` → 신중히 만든 문자열 순으로 고르고, index는 정말 고정 리스트일 때만 씁니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [React docs — Rendering Lists](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
