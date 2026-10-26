# ساحة نوفا — Nova Arena

لعبة أرينا عربية ثلاثية ضد ثلاث، **تطبيق مستقل تماماً** عن أي تطبيق آخر.
لا تشترك مع Lin Go أو أي مشروع تعلّم لغة في الحزمة أو التوقيع أو المستودع أو النشر.

## الروابط

- العب في المتصفح: https://nova-arena-game.vercel.app/
- صفحة التثبيت وQR: https://nova-arena-game.vercel.app/install.html
- تحميل APK مباشرة: https://nova-arena-game.vercel.app/nova-arena.apk
- المستودع المستقل: https://github.com/hmachikh16-boop/nova-arena

## هوية التطبيق

- الاسم: ساحة نوفا / Nova Arena
- معرّف الحزمة: `com.novaarena.game`
- الإصدار: `1.0.0`
- أندرويد: 7.0 (API 24) فأحدث
- التوجه: أفقي
- التطبيق يعمل دون اتصال؛ اللعبة كاملة داخل حزمة التطبيق.
- مفتاح توقيع خاص داخل `android/nova-arena-release.keystore` (غير مرفوع للمستودع).

## التشغيل محلياً

```powershell
npx serve web
```

ثم افتح الرابط الظاهر في المتصفح. أي خادم ملفات ثابت يعمل أيضاً.

## بناء تطبيق أندرويد

يتطلب Android SDK وJDK 17+.

```powershell
cd android
.\gradlew.bat assembleRelease
```

ملف APK يظهر في:

```
android/app/build/outputs/apk/release/app-release.apk
```

ملف التوقيع المحلي `android/nova-signing.properties` غير مرفوع. لإنشاء مفتاح
جديد استخدم `keytool` ثم أنشئ الملف بالمفاتيح:

```properties
storeFile=nova-arena-release.keystore
storePassword=...
keyAlias=nova-arena
keyPassword=...
```

## البنية

```
web/                 اللعبة الكاملة (HTML/CSS/JS) + صفحة التثبيت + APK
android/             مشروع Android أصلي مستقل (WebView + أصول اللعبة)
android/app/...      الحزمة com.novaarena.game
```

## الخرائط

1. معبد الغابة
2. مدينة النيون
3. أنقاض الرمال
4. الممر الجليدي
5. محطة الفضاء

## الأبطال

نوفا، بوبليكس، غريز، فيكس، بيبيت، كاكتوسيتو، روكو، فليكي، زايرا، شاركي.

كل الشخصيات والخرائط والرسومات أصلية. لا تحتوي اللعبة على أي أصول أو شخصيات
أو أسماء أو علامات تجارية من ألعاب أخرى.
