## 1. JPA 데이터 타입

### 엔티티 타입
- `@Entity`로 정의
- 식별자로 추적 가능
- 데이터가 변해도 식별자로 구분

### 값 타입
- 식별자 없음
- 단순 값으로 사용
- 변경 시 추적 불가

## 2. 값 타입 종류

### 기본값 타입
- 자바 기본 타입: `int`, `double`
- 래퍼 클래스: `Integer`, `Long`
- `String`

### 임베디드 타입 (복합 값 타입)
- 직접 정의한 값 타입
- `@Embeddable`, `@Embedded` 사용

### 컬렉션 값 타입
- 값 타입 컬렉션
- `@ElementCollection` 사용

## 3. 임베디드 타입

### 사용법
```java
@Embeddable
public class Address {
    private String city;
    private String street;
    private String zipcode;
}

@Entity
public class Member {
    @Embedded
    private Address address;
}
```

### 장점
- 재사용 가능
- 응집도 높음
- 의미있는 메소드 추가 가능
- 테이블 구조는 동일

### 속성 재정의
```java
@AttributeOverrides({
    @AttributeOverride(name="city", column=@Column(name="WORK_CITY"))
})
private Address workAddress;
```

## 4. 값 타입과 불변 객체

### 공유 참조의 위험
```java
Address address = new Address("Old");
member1.setAddress(address);
member2.setAddress(address);  // 같은 참조 공유 위험!
```

### 해결: 불변 객체로 만들기
```java
@Embeddable
public class Address {
    private String city;
    
    public Address(String city) {
        this.city = city;
    }
    
    // Getter만 제공, Setter는 제공 안함
    public String getCity() { return city; }
}
```

### 핵심
- **생성자로만 값 설정**
- **Setter 만들지 않기**
- 값 변경 필요시 새 객체 생성

## 5. 값 타입 비교

### 동일성 vs 동등성
- **동일성(identity)**: `==` 비교, 참조 비교
- **동등성(equivalence)**: `equals()` 비교, 값 비교

### 값 타입은 equals() 사용
```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Address address = (Address) o;
    return Objects.equals(city, address.city) &&
           Objects.equals(street, address.street) &&
           Objects.equals(zipcode, address.zipcode);
}

@Override
public int hashCode() {
    return Objects.hash(city, street, zipcode);
}
```

## 6. 값 타입 컬렉션

### 사용법
```java
@Entity
public class Member {
    @ElementCollection
    @CollectionTable(name = "FAVORITE_FOOD")
    private Set<String> favoriteFoods = new HashSet<>();
    
    @ElementCollection
    @CollectionTable(name = "ADDRESS")
    private List<Address> addressHistory = new ArrayList<>();
}
```

### 제약사항
- 식별자 개념 없음
- 변경 시 전체 삭제 후 재저장
- 실무에서는 일대다 관계 사용 권장

### 대안: 일대다 엔티티로 승격
```java
@Entity
public class AddressEntity {
    @Id @GeneratedValue
    private Long id;
    
    @Embedded
    private Address address;
}

@Entity
public class Member {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AddressEntity> addressHistory = new ArrayList<>();
}
```

## 7. 정리

### 엔티티 타입
- 식별자 있음
- 생명주기 관리
- 공유 가능

### 값 타입
- 식별자 없음
- 생명주기는 엔티티에 의존
- 공유하지 않음 (복사 사용)
- 불변 객체로 설계

### 사용 기준
- **값 타입**: 단순 값으로만 사용
- **엔티티**: 식별자 필요, 추적/변경 필요

---

## 핵심 원칙

> 값 타입은 정말 값 타입이라 판단될 때만 사용  
> 식별자가 필요하면 엔티티로 만들 것  
> 값 타입은 불변 객체로 설계  
> 공유 참조 대신 복사 사용