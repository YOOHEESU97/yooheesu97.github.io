---
title: 'Java ConcurrentModificationException — for-each 돌리면서 remove할 때'
description: 'Iterator로 안전하게 삭제하고 CopyOnWriteArrayList를 쓰는 경우 정리'
pubDate: 2026-06-28
category: java
tags: ['java', 'collections', 'error']
---

`java.util.ConcurrentModificationException`은 리스트를 순회하는 도중 **구조가 바뀌었을 때** 터집니다. for-each 안에서 `list.remove(item)` 호출하면 바로 이 예외가 나오죠. 면접에서도 나오고, 실무 로그에서도 꽤 자주 봤어요.

## 전형적인 틀린 코드

```java
List<String> items = new ArrayList<>(List.of("a", "b", "c"));

for (String item : items) {
    if (item.equals("b")) {
        items.remove(item); // ConcurrentModificationException
    }
}
```

for-each는 내부적으로 Iterator를 쓰는데, Iterator 밖에서 리스트를 수정하면 modCount가 어긋납니다.

## 해결 1: Iterator.remove()

```java
Iterator<String> it = items.iterator();
while (it.hasNext()) {
    String item = it.next();
    if (item.equals("b")) {
        it.remove();
    }
}
```

**같은 Iterator**로 순회와 삭제를 하면 안전합니다.

## 해결 2: removeIf (Java 8+)

```java
items.removeIf(item -> item.equals("b"));
```

가독성이 좋고 실무에서 제일 많이 씁니다.

## 해결 3: 역순 for 루프 (인덱스)

```java
for (int i = items.size() - 1; i >= 0; i--) {
    if (items.get(i).equals("b")) {
        items.remove(i);
    }
}
```

인덱스가 밀리지 않게 뒤에서부터 제거합니다.

## 해결 4: 복사본 순회

```java
for (String item : new ArrayList<>(items)) {
    if (item.equals("b")) {
        items.remove(item);
    }
}
```

원본을 수정하지만 순회는 복사본으로 합니다. 리스트가 크면 비용이 있습니다.

## 멀티스레드 환경

여러 스레드가 같은 `ArrayList`를 건드리면 CME 말고도 데이터 레이스가 납니다.

- 읽기 많고 쓰기 적음: `CopyOnWriteArrayList`
- 일반적인 공유 컬렉션: `Collections.synchronizedList` + 동기화 블록, 또는 `ConcurrentHashMap`

## Stream으로 필터링

```java
List<String> filtered = items.stream()
    .filter(item -> !item.equals("b"))
    .toList();
```

원본을 유지할지 교체할지에 따라 선택합니다.

## 마무리

CME는 "순회 중 수정 금지" 규칙을 어겼다는 신호입니다. `removeIf`나 Iterator 패턴으로 바꾸면 대부분 끝납니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Java SE — ConcurrentModificationException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ConcurrentModificationException.html)
