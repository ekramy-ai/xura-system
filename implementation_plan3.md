# نظام قاعدة بيانات الحكام مع صلاحيات الوصول للمباريات

## الوضع الحالي

النظام الحالي يحتوي على:
- **match-setup.html** — إعداد المباراة (اختيار بطولة، فريق Home/Away) ثم توجيه للحكم
- **xura-referee-v3.html** — واجهة الحكم لتسجيل النقاط (يعتمد على `matchId` في الرابط)
- **xura-live-v2.html** — لوحة البث المباشر
- **xura-db-manager.html** — إدارة البطولات والفرق

### المشكلة:
1. ❌ لا يوجد نظام تسجيل دخول للحكام
2. ❌ أي شخص يملك الرابط يمكنه الدخول لأي مباراة
3. ❌ لا يمكن تعيين حكم لمباراة محددة
4. ❌ لا يمكن تشغيل أكثر من مباراة بشكل منظّم مع التحكم في الحكام

## الحل المقترح

> [!IMPORTANT]
> سيتم استخدام **Firebase Firestore** فقط (بدون Firebase Auth) مع نظام PIN Code بسيط لكل حكم. هذا ليس آمن بنسبة 100% ولكنه عملي ومناسب لبيئة البطولات.

## المتطلبات

### 1. قاعدة بيانات الحكام (Firestore Collection: `referee_users`)
```
referee_users/{refereeId}
├── name_ar: "أحمد محمد"
├── name_en: "Ahmed Mohamed"
├── pin: "1234"               ← رمز دخول مكون من 4 أرقام
├── role: "referee"           ← referee | admin
├── assignedMatches: ["match_123", "match_456"]  ← المباريات المسموح بها
├── active: true
├── createdAt: timestamp
```

### 2. تحديث بنية المباريات (Firestore Collection: `matches`)
```
matches/{matchId}
├── ... (الحقول الحالية)
├── assignedReferee: "ref_abc"    ← ID الحكم المعين
├── refereeName: "أحمد محمد"     ← اسم الحكم للعرض
```

### 3. صفحات جديدة ومعدلة

---

## Proposed Changes

### صفحة تسجيل دخول الحكم

#### [NEW] [xura-referee-login.html](file:///c:/Users/Lenovo/Desktop/XURAAA/xura-referee-login.html)

صفحة تسجيل دخول أنيقة للحكام:
- إدخال **اسم الحكم** (اختيار من قائمة) + **PIN Code** (4 أرقام)
- عند التحقق الناجح: حفظ بيانات الحكم في `sessionStorage`
- عرض **قائمة المباريات المتاحة** للحكم فقط (المعينة له)
- الحكم يختار المباراة ← يتم توجيهه لـ `xura-referee-v3.html?matchId=xxx`
- تصميم premium بنفس style النظام الحالي (dark theme, glassmorphism, teal accents)

**الشكل:**
```
┌─────────────────────────┐
│      🛡️ XURA            │
│   Referee Login          │
│                          │
│  [▾ اختر الحكم        ] │
│  [●●●● PIN Code       ] │
│                          │
│  [ تسجيل الدخول  🔓  ]  │
│                          │
│  ─── المباريات المتاحة ─── │
│  ┌──────────────────────┐│
│  │ 🟢 الزمالك vs الأهلي ││
│  │    U18 - بنين        ││
│  │    [دخول المباراة]   ││
│  └──────────────────────┘│
│  ┌──────────────────────┐│
│  │ 🟡 سموحة vs الجيش   ││
│  │    Senior - بنات     ││
│  │    [دخول المباراة]   ││
│  └──────────────────────┘│
└─────────────────────────┘
```

---

### تحديث إدارة قاعدة البيانات

#### [MODIFY] [xura-db-manager.html](file:///c:/Users/Lenovo/Desktop/XURAAA/xura-db-manager.html)

إضافة قسم **"إدارة الحكام"** يشمل:
- إضافة حكم جديد (اسم عربي، اسم إنجليزي، PIN)
- عرض قائمة الحكام الحاليين
- حذف حكم
- تعديل PIN

---

### تحديث إعداد المباراة

#### [MODIFY] [match-setup.html](file:///c:/Users/Lenovo/Desktop/XURAAA/match-setup.html)

- إضافة dropdown لاختيار **الحكم المعين** للمباراة
- حفظ `assignedReferee` و `refereeName` في document المباراة
- تحديث `assignedMatches` للحكم المختار في `referee_users`

---

### تحديث واجهة الحكم

#### [MODIFY] [xura-referee-v3.html](file:///c:/Users/Lenovo/Desktop/XURAAA/xura-referee-v3.html)

- عند الدخول: التحقق من وجود بيانات الحكم في `sessionStorage`
- إذا لم يكن مسجل دخول ← توجيه لصفحة `xura-referee-login.html`
- التحقق من أن الحكم مسموح له بالدخول لهذه المباراة (`assignedMatches`)
- عرض اسم الحكم في الـ header

---

### تحديث لوحة البث المباشر

#### [MODIFY] [xura-live-v2.html](file:///c:/Users/Lenovo/Desktop/XURAAA/xura-live-v2.html)

- تحديث الـ dashboard ليعرض **جميع المباريات الحية** (مش مباراة واحدة)
- كل مباراة تظهر في card منفصل مع اسم الحكم
- الضغط على أي مباراة يعرض تفاصيلها

---

## Open Questions

> [!IMPORTANT]
> **1. هل تحتاج Admin Login منفصل؟**
> حالياً صفحة الـ DB Manager وصفحة Match Setup متاحة لأي شخص. هل تريد حماية هذه الصفحات أيضاً بكلمة سر Admin؟

> [!IMPORTANT]
> **2. هل الحكم يمكن أن يكون معين لأكثر من مباراة في نفس الوقت؟**
> التصميم الحالي يدعم ذلك، لكن من الأفضل تحديد هل هذا مطلوب أم كل حكم لمباراة واحدة فقط.

> [!IMPORTANT]
> **3. هل تريد أن يقدر أي شخص يفتح الـ Live Dashboard بدون تسجيل دخول؟**
> الوضع الحالي هو كده (الـ Live مفتوح للجميع) — هل تريد تغيير ذلك؟

---

## Verification Plan

### Automated Tests
- فتح صفحة تسجيل الدخول في المتصفح والتحقق من عمل الـ PIN
- إنشاء حكم → تعيينه لمباراة → التحقق من ظهور المباراة فقط
- محاولة دخول مباراة غير مسموح بها ← التحقق من الرفض

### Manual Verification
- تشغيل مباراتين في نفس الوقت بحكمين مختلفين
- التحقق من أن كل حكم يرى فقط المباراة المعينة له
- التحقق من ظهور المباراتين على الـ Live Dashboard
