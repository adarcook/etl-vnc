# מיפוי ETL: מקובצי JSON לקובצי CSV

תאריך: 11.11.2026. מקור: הקוד שנקרא מענף main והדוח המקומי [Issue 2](https://github.com/adarcook/etl-vnc/issues/2).

זהו תיאור של ההתנהגות בקוד, לא אישור שהדרישות העסקיות נכונות. לא הורץ ETL על הארכיון ולא נבדקו CSV שנוצרו בפועל. דוח הקלט מציג מבנה חלקי בלבד; קבצי DevicesV7, FiberCables ו־Services הגדולים לא נותחו בתוכו. רשימות העמודות בהמשך נלקחו מפקודות הייצוא, ולא הוסקו משמות הקבצים.

## איך לקרוא את המסמך

1. שלב 1: אילו קבצים נכנסים ולאיזה JSON ביניים הם הופכים.
2. שלב 2: לכל CSV — מאיזה JSON הוא מגיע, איזו ישות הוא מתאר, וכיצד נקבעת שורה בפלט.
3. שלב 3: כל עמודות ה־CSV בסדר המדויק, עם מקור או חישוב לכל עמודה.

מונחים: ציוד הוא מכשיר; כרטיס הוא רכיב בציוד; פורט הוא נקודת חיבור; מדף הוא מארז לכרטיסים; חריץ הוא מקום לכרטיס; טופולוגיה מתארת חיבורים; שירות מתאר חיבור מסופק והמשאבים או המסלול שלו. הקוד מבדיל בין סוגי ציוד לפי הערכים rdm ו־xpdr. אין צורך להכיר לעומק את הטכנולוגיות כדי לקרוא את כללי המיפוי.

## שלב 1 — בחירת הקלט וחילוץ JSON ביניים

הסקריפט הראשי הוא [do-all.sh](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/do-all.sh). בריצה רגילה הארכיון חייב להיות גדול מ־50,000,000 בתים. לאחר חילוץ, find מחפש רק קבצים רגילים בגודל מעל 1 MiB, לפי התבניות הבאות. החיפוש מתבצע בתיקייה הנוכחית ובתתי־תיקיותיה, לא רק ברשימת חברי הארכיון האחרון.

| תבנית בשם הקובץ | מה מחלצים | JSON ביניים | collection ב־dap |
|---|---|---|---|
| `*_GetDevicesV2deployed*` | `openroadm-devices` | `DevicesV2deployed.json` | `devices` |
| `*_GetDevicesV7deployed*` | `openroadm-devices` | `DevicesV7deployed.json` | `devices7` |
| `*_GetFiberCables*` | `fiber-cable` | `FiberCables.json` | `fiber_cables` |
| `*_GetFiberTails*` | `tail` | `FiberTails.json` | `fiber_tails` |
| `*_GetIOFL*` | `inter-office-fiber-link` | `IOFL.json` | `iofl` |
| `*_GetServices*` | `services` | `Services.json` | `services` |

### פיצול קובצי הרשתות

כל אחת מהתבניות `*_GetNetworksV7*` ו־`*_GetNetworksV13*` נבדקת באותו אופן. נסמן את הגרסה ב־N (7 או 13).

| בחירה מתוך network-list | JSON ביניים (N מוחלף בגרסה) | collection |
|---|---|---|
| הרשת הראשונה עם `network-id = openroadm-network`, מתוכה `node` | `NetworksVN_network.json` | `networks_vN_openroadm_network` |
| הרשת הראשונה עם `network-id = openroadm-topology`, מתוכה `node` | `NetworksVN_topology.json` | `networks_vN_openroadm_topology` |
| הרשת הראשונה עם `network-id = otn-topology`, מתוכה `node` | `NetworksVN_otn_topology.json` | `networks_vN_openroadm_otn_topology` |
| איסוף כל איברי `ietf-network-topology:link` מכל הרשתות | `NetworkvN_ietf_network_topology.json` | `networks_vN_ietf_network_topology` |

לדוגמה: `NetworksV13_network.json` ו־`Networkv13_ietf_network_topology.json`. ההבדל באותיות וב־s הוא כפי שמופיע בקוד. בחירת node לוקחת רק את הרשת הראשונה שתואמת. לעומת זאת חילוץ links אוסף מכל הרשתות, ומדלג על מערכים חסרים. אין במסלול הזה חילוץ נפרד של רשת CLLI.

### מה לא נבחר ומה עלול להידרס

- קובצי ציוד planned, הקבצים הכלליים ללא deployed, ציוד V13, GetTempServices, subscriptions ו־actionhandlers אינם נבחרים על ידי תבניות הריצה הנוכחית.
- לפי הדוח, GetNetworksV7 הוא 44 בתים ולכן אינו עובר את סינון הגודל. GetNetworksV13 כן עובר.
- אם שני קבצים מתאימים לאותה תבנית, כל אחד כותב מחדש לאותו JSON ביניים באמצעות `>`: האחרון שמעובד מחליף את הקודם. זו אינה פעולת איחוד. בדוח הקיים לא הוכחה התנגשות כזו.
- קבצים ישנים שנשארו בתיקיית הריצה עלולים להשתתף בחיפוש; ניקוי קובצי הביניים מושבת בקוד שנקרא.
- הייבוא משתמש ב־`--jsonArray --drop`: מסמכים חדשים מחליפים את collection היעד. שני קובצי הציוד הם קריטיים; כשל בקבצים אחרים נספר והתהליך עשוי להמשיך. אין להסיק מהמשך הריצה שכל הנתונים נטענו.
- קובצי V7 של רשתות מיובאים אם קיימים, אך ארבעת ייצואי הרשת הפעילים קוראים מ־V13. שמות ה־CSV עדיין מכילים v7.

## שלב 2 — כללי העיבוד לפי JSON ו־CSV

### כללים משותפים

- **בחירת שדות:** רק העמודות המוגדרות בפקודת הייצוא נכנסות ל־CSV. שדה שנמצא ב־JSON או אפילו ב־View אינו בהכרח מיוצא.
- **פירוק מערך:** כל איבר יוצר שורה; שדות ההורה חוזרים. בפירוק נוסף, רמת השורה יורדת שוב. למשל מדף ואז slots פירושו שורה לחריץ במדף.
- **מערך חסר/ריק:** כשמצוין שימור, נשמרת רשומת ההורה גם ללא איבר. ללא שימור היא אינה מפיקה שורה באותו שלב. מדובר בהתנהגות מערכים; ערך סקלרי לא־ריק עשוי להיחשב איבר יחיד ב־unwind.
- **FIRST:** בחירת איבר 0 מתוך מערך הערכים שמתקבל מהנתיב. זו בחירה לכל שדה בנפרד, לא מיון לפי sequence-number ולא הבטחה שכל השדות מגיעים מאותו איבר משאב כשיש שדות חסרים.
- **איחוד RDM:** מצרפים את `devices7` ואת `devices` עם unionWith, ואז בוחרים `info.node-type = rdm`. אין הסרת כפילויות ואין העדפת גרסה. זהו View ביניים, לא קובץ JSON מאוחד.
- **hash:** השדות בשלב שלפני החישוב מומרים למחרוזות ומחוברים ללא מפריד; null מוחלף במחרוזת ריקה; מופעל `$toHashedIndexKey`. אין הבטחת ייחודיות ואין זה מפתח עסקי יציב. שדות שנכללים ב־hash יכולים להיות רחבים יותר מהעמודות המיוצאות. המרה ל־string אינה מבטיחה תמיכה במערך או אובייקט; אין בקוד טיפול כללי בכשלי המרה כאלה.
- **סדר:** סדר עמודות ה־CSV קבוע. אין בשלבים שנבדקו sort שמבטיח סדר שורות עסקי.

### 2.1 — `devices_base_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** פרטי ציוד RDM; שורה לכל מסמך ציוד שעבר את הסינון.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_base_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.2 — `devices_base_xpdr.csv`

**JSON מקור:** `DevicesV2deployed.json`

**משמעות הישות והשורה:** פרטי ציוד XPDR מ־V2; שורה לכל מסמך ציוד.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_base_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.3 — `devices7_base_xpdr.csv`

**JSON מקור:** `DevicesV7deployed.json`

**משמעות הישות והשורה:** פרטי ציוד XPDR מ־V7; שורה לכל מסמך ציוד.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices7_base_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.4 — `devices_circuit_packs_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** כרטיסים בציוד RDM; שורה לכרטיס, עם פרטי הציוד.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_circuit_packs_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.5 — `devices_circuit_pack_xpdr.csv`

**JSON מקור:** `DevicesV2deployed.json`

**משמעות הישות והשורה:** כרטיסים בציוד XPDR מ־V2; שורה לכרטיס.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_circuit_packs_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- מפרקים את `org-openroadm-device.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.6 — `devices7_circuit_pack_xpdr.csv`

**JSON מקור:** `DevicesV7deployed.json`

**משמעות הישות והשורה:** כרטיסים ופורטים בציוד XPDR מ־V7; בפועל שורה לפורט בכרטיס, לא רק לכרטיס.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices7_circuit_pack_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- מפרקים את `org-openroadm-device.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `ports` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.7 — `devices_circuit_packs_cp_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** חריצים פנימיים בכרטיס RDM; שורה לכל cp-slot.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_circuit_packs_cp_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `org-openroadm-device.circuit-packs.cp-slots` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.8 — `devices_interfaces_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** ממשקים בציוד RDM; שורה לממשק.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_interfaces_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.interface` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.9 — `devices_interfaces_xpdr.csv`

**JSON מקור:** `DevicesV7deployed.json`

**משמעות הישות והשורה:** ממשקים בציוד XPDR מ־V7 בלבד; שורה לממשק. אין כאן איחוד עם V2.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_interfaces_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- מפרקים את `org-openroadm-device.interface` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.10 — `devices_interfaces_oms_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** תת־קבוצה של ממשקי RDM ששמם מכיל oms-. הסינון הוא על שם, לא על שדה type.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_interfaces_oms_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.interface` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- מסננים לפי: `{"name":{"$regex":"oms-"}}`.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.11 — `devices_interfaces_ots_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** תת־קבוצה של ממשקי RDM ששמם מכיל ots-. הסינון הוא על שם, לא על שדה type.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_interfaces_ots_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.interface` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- מסננים לפי: `{"name":{"$regex":"ots-"}}`.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.12 — `devices_physical_link_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** קשרים פיזיים המתוארים בתוך מסמך הציוד, עם כרטיס ופורט מקור ויעד; שורה לכל physical-link.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_physical_link_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.physical-link` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.13 — `devices_port_parents_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** פורטים בכרטיסי RDM והפניות לכרטיס ההורה; שורה לפורט, עם שימור הורה כשאין פורטים. interface-name נלקח מהערך הראשון.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_port_parents_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `ports` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.14 — `devices_srg_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** קבוצות shared-risk-group והכרטיסים הרשומים בהן; שורה לכרטיס בתוך קבוצה, עם שימור הורים חסרים. אין כאן חישוב עצמאי של סיכון.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_srg_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `shared-risk-group` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `shared-risk-group.circuit-packs` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.15 — `devices_shelf_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** מדפים והחריצים שבתוכם; בפועל שורה לחריץ במדף. נשמרים גם ציוד/מדף ללא מערך פנימי.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_shelf_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.shelves` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `org-openroadm-device.shelves.slots` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.16 — `devices_shelf_xpdr.csv`

**JSON מקור:** `DevicesV2deployed.json`

**משמעות הישות והשורה:** מדפים והחריצים שבתוכם; בפועל שורה לחריץ במדף. נשמרים גם ציוד/מדף ללא מערך פנימי.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_shelf_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- מפרקים את `org-openroadm-device.shelves` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `org-openroadm-device.shelves.slots` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.17 — `devices7_shelf_xpdr.csv`

**JSON מקור:** `DevicesV7deployed.json`

**משמעות הישות והשורה:** מדפים והחריצים שבתוכם; בפועל שורה לחריץ במדף. נשמרים גם ציוד/מדף ללא מערך פנימי.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices7_shelf_xpdr_view`.

- מסננים לפי: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- מפרקים את `org-openroadm-device.shelves` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `org-openroadm-device.shelves.slots` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.18 — `devices_degree_rdm.csv`

**JSON מקור:** `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

**משמעות הישות והשורה:** כיווני חיבור (degree) בציוד RDM; שורה לכל connection-port בכיוון, עם שימור הורים חסרים.

**קוד:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js), View: `devices_degree_rdm_view`.

- מקור הנתונים כבר כולל צירוף V2 ו־V7 וסינון RDM; אין הסרת כפילויות.
- מסננים לפי: `{"org-openroadm-device.info.node-type":"rdm"}`.
- מפרקים את `org-openroadm-device.degree` לשורות; משמרים רשומה עם מערך חסר/ריק.
- מפרקים את `org-openroadm-device.degree.connection-ports` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.19 — `fiber_cables_base_rdm.csv`

**JSON מקור:** `FiberCables.json`

**משמעות הישות והשורה:** כבל וסיביו; שורה לכל fiber-cable-strand. כבל ללא סיבים לא מפיק שורה.

**קוד:** [fiber_cables.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_cables.js), View: `fiber_cables_base_view`.

- מפרקים את `fiber-cable-strand` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.20 — `fiber_tails.csv`

**JSON מקור:** `FiberTails.json`

**משמעות הישות והשורה:** סיכום Tail — ישות חיבור עם תיאור לכיוון הלקוח ולכיוון הרשת; שורה למסמך Tail. בוחרים ערך ראשון לכל שדה במסלולים. wiring-record-entry אינו נפרס לטבלה.

**קוד:** [fiber_tails.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_tails.js), View: `fiber_tails_view`.

- אין פירוק מערכים או סינון רשומות ב־View; העיבוד הוא בחירת שדות וחישובים.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.21 — `iofl_client.csv`

**JSON מקור:** `IOFL.json`

**משמעות הישות והשורה:** קישור בין אתרים, מבט לכיוון הלקוח; שורה למסמך IOFL עם קצוות A/Z. ערכי המשאבים נבחרים בנפרד באמצעות FIRST.

**קוד:** [iofl.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js), View: `iofl_client_view`.

- אין פירוק מערכים או סינון רשומות ב־View; העיבוד הוא בחירת שדות וחישובים.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.22 — `iofl_network.csv`

**JSON מקור:** `IOFL.json`

**משמעות הישות והשורה:** אותו קישור בין אתרים, מבט לכיוון הרשת; שורה למסמך IOFL עם קצוות A/Z. אין join ל־FiberTails: קוראים את ה־tails המקוננים במסמך IOFL עצמו.

**קוד:** [iofl.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js), View: `iofl_network_view`.

- אין פירוק מערכים או סינון רשומות ב־View; העיבוד הוא בחירת שדות וחישובים.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.23 — `networks_v7_openroadm_network.csv`

**JSON מקור:** `NetworksV13_network.json`

**משמעות הישות והשורה:** צומת ויכולות XPDR נתמכות; שורה לכל supported-xpdr עם שימור צומת חסר מערך. הפניות supporting-node וערכי operational-mode נבחרים באמצעות FIRST.

**קוד:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js), View: `networks_v13_openroadm_network_view`.

- מפרקים את `org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.24 — `networks_v7_openroadm_topology.csv`

**JSON מקור:** `NetworksV13_topology.json`

**משמעות הישות והשורה:** נקודות קצה בצמתים (termination points); שורה לנקודת קצה, עם שימור צומת חסר מערך. supporting-node נבחר ראשון.

**קוד:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js), View: `networks_v13_openroadm_topology_view`.

- מפרקים את `ietf-network-topology:termination-point` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.25 — `networks_v7_openroadm_otn_topology.csv`

**JSON מקור:** `NetworksV13_otn_topology.json`

**משמעות הישות והשורה:** נקודות קצה בצמתי רשת otn-topology; שורה לנקודת קצה עם שימור. קיימת אי־התאמת עמודות ייצוא, ראו בהמשך.

**קוד:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js), View: `networks_v13_openroadm_otn_topology_view`.

- מפרקים את `ietf-network-topology:termination-point` לשורות; משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.26 — `networks_v7_ietf_network_topology.csv`

**JSON מקור:** `Networkv13_ietf_network_topology.json`

**משמעות הישות והשורה:** קישור בין צומת/נקודת קצה מקור לצומת/נקודת קצה יעד; שורה לכל link שחולץ. אין סינון סטטוס ב־View.

**קוד:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js), View: `networks_v13_ietf_network_topology_view`.

- אין פירוק מערכים או סינון רשומות ב־View; העיבוד הוא בחירת שדות וחישובים.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.27 — `services_base.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** פרטי שירות וקצוות A/Z; שורה לשירות. פרטי פורטים בכיווני rx/tx נבחרים באמצעות FIRST. אין סינון deployed ב־View זה.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_base_view`.

- אין פירוק מערכים או סינון רשומות ב־View; העיבוד הוא בחירת שדות וחישובים.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.28 — `services_a_2_z_topology.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** שלבי מסלול השירות מ־A ל־Z; שורה לכל איבר topology.aToZ. אין סינון deployed.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_a_2_z_topology_view`.

- מפרקים את `topology.aToZ` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.29 — `services_z_2_a_topology.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** שלבי מסלול השירות מ־Z ל־A; שורה לכל איבר topology.zToA. אין סינון deployed.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_z_2_a_topology_view`.

- מפרקים את `topology.zToA` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.30 — `services_a_2_z_network_topology.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** משאבי רשת במסלול A→Z; רק שירותים deployed, שורה לכל איבר network-topology.a-to-z.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_a_2_z_network_topology_view`.

- מסננים לפי: `{"lifecycle-state":"deployed"}`.
- מפרקים את `network-topology.a-to-z` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.31 — `services_z_2_a_network_topology.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** משאבי רשת במסלול Z→A; רק שירותים deployed, שורה לכל איבר network-topology.z-to-a.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_z_2_a_network_topology_view`.

- מסננים לפי: `{"lifecycle-state":"deployed"}`.
- מפרקים את `network-topology.z-to-a` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

### 2.32 — `services_otn.csv`

**JSON מקור:** `Services.json`

**משמעות הישות והשורה:** יחס בין שירות לשירות תומך; רק deployed, שורה לכל supporting-service-name. אין סינון service-layer נוסף בקוד למרות שם הקובץ.

**קוד:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js), View: `services_otn_view`.

- מסננים לפי: `{"lifecycle-state":"deployed"}`.
- מפרקים את `supporting-service-name` לשורות; לא משמרים רשומה עם מערך חסר/ריק.
- בוחרים/משנים שמות שדות ומוסיפים hash לפי הכלל המשותף. רשימת העמודות ומקורותיהן בשלב 3.

## שלב 3 — מבנה כל CSV ומקורות העמודות

כל קובץ נכתב לתיקיית `out`. המספר בעמודה הראשונה הוא סדר העמודה ב־CSV. הנתיבים בטבלאות הם יחסיים למסמך שיובא ל־collection, לאחר חילוץ המערך בשלב 1. פירוקי המערכים הם אלה המפורטים בשלב 2; נתיב מקונן לאחר פירוק מתייחס לאיבר הנוכחי. FIRST מציין את בחירת איבר 0. אין כאן הנחה של JOIN בין קבצים.

המיפוי עוקב גם אחרי שמות ביניים בתוך רצף ה־project. שדה שנעלם במהלך ההקרנות מסומן כחסר; אין תיקון אוטומטי לשגיאות כתיב. hash מסומן בנפרד ואינו מוצג כמזהה שהגיע מהמקור.

### 3.1 — `devices_base_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `node-number` | org-openroadm-device.info.node-number |
| 8 | `serial-id` | org-openroadm-device.info.serial-id |
| 9 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 10 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 11 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 12 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.2 — `devices_base_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 8 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 9 | `node-number` | org-openroadm-device.info.node-number |
| 10 | `serial-id` | org-openroadm-device.info.serial-id |
| 11 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 12 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.3 — `devices7_base_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 8 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 9 | `node-number` | org-openroadm-device.info.node-number |
| 10 | `serial-id` | org-openroadm-device.info.serial-id |
| 11 | `software-build` | org-openroadm-device.info.software-build |
| 12 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 13 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.4 — `devices_circuit_packs_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 4 | `clli` | org-openroadm-device.info.clli |
| 5 | `clei` | org-openroadm-device.circuit-packs.clei |
| 6 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 7 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 8 | `circuit-pack-model` | org-openroadm-device.circuit-packs.model |
| 9 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 10 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 11 | `software-load-version` | org-openroadm-device.circuit-packs.software-load-version |
| 12 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 13 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 14 | `manufacture-date` | org-openroadm-device.circuit-packs.manufacture-date |
| 15 | `is-pluggable-optics` | org-openroadm-device.circuit-packs.is-pluggable-optics |
| 16 | `Shelf` | org-openroadm-device.circuit-packs.shelf |
| 17 | `slot` | org-openroadm-device.circuit-packs.slot |
| 18 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 19 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 20 | `type` | org-openroadm-device.circuit-packs.type |
| 21 | `administrative-state` | org-openroadm-device.circuit-packs.administrative-state |
| 22 | `equipment-state` | org-openroadm-device.circuit-packs.equipment-state |
| 23 | `operational-state` | org-openroadm-device.circuit-packs.operational-state |
| 24 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.5 — `devices_circuit_pack_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 3 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 4 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 5 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 6 | `clei` | org-openroadm-device.circuit-packs.clei |
| 7 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 8 | `model` | org-openroadm-device.circuit-packs.model |
| 9 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 10 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 11 | `shelf` | org-openroadm-device.circuit-packs.shelf |
| 12 | `slot` | org-openroadm-device.circuit-packs.slot |
| 13 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 14 | `software-load-version` | org-openroadm-device.circuit-packs.software-load-version |
| 15 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 16 | `type` | org-openroadm-device.circuit-packs.type |
| 17 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.6 — `devices7_circuit_pack_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 5 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 6 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 7 | `faceplate-label` | org-openroadm-device.circuit-packs.faceplate-label |
| 8 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 9 | `model` | org-openroadm-device.circuit-packs.model |
| 10 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 11 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 12 | `shelf` | [חסר ב־View הסופי] |
| 13 | `slot` | org-openroadm-device.circuit-packs.slot |
| 14 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 15 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 16 | `port-faceplate-label` | org-openroadm-device.circuit-packs.ports.faceplate-label |
| 17 | `port-direction` | org-openroadm-device.circuit-packs.ports.port-direction |
| 18 | `port-name` | org-openroadm-device.circuit-packs.ports.port-name |
| 19 | `port-type` | org-openroadm-device.circuit-packs.ports.port-type |
| 20 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.7 — `devices_circuit_packs_cp_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 3 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 4 | `shelf` | [חסר ב־View הסופי] |
| 5 | `slot` | org-openroadm-device.circuit-packs.slot |
| 6 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 7 | `cp-slots-name` | org-openroadm-device.circuit-packs.cp-slots.slot-name |
| 8 | `cp-slots-type` | org-openroadm-device.circuit-packs.cp-slots.slot-type |
| 9 | `provisioned-circuit-pack` | org-openroadm-device.circuit-packs.cp-slots.provisioned-circuit-pack |
| 10 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.8 — `devices_interfaces_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `description` | org-openroadm-device.interface.description |
| 4 | `administrative-state` | org-openroadm-device.interface.administrative-state |
| 5 | `operationale-state` | org-openroadm-device.interface.operational-state |
| 6 | `circuit-id` | org-openroadm-device.interface.circuit-id |
| 7 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 8 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 9 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 10 | `mc-ttp-center-freq` | org-openroadm-device.interface.mc-ttp.center-freq |
| 11 | `mc-ttp-max-freq` | org-openroadm-device.interface.mc-ttp.max-freq |
| 12 | `mc-ttp-min-freq` | org-openroadm-device.interface.mc-ttp.min-freq |
| 13 | `mc-ttp-slot-width` | org-openroadm-device.interface.mc-ttp.slot-width |
| 14 | `nmc_ctp_frequency` | org-openroadm-device.interface.nmc-ctp.frequency |
| 15 | `nmc_ctp_width` | org-openroadm-device.interface.nmc-ctp.width |
| 16 | `type` | org-openroadm-device.interface.type |
| 17 | `ethernet-auto-negotiation` | org-openroadm-device.interface.ethernet.auto-negotiation |
| 18 | `ethernet-duplex` | org-openroadm-device.interface.ethernet.duplex |
| 19 | `ethernet-speed` | org-openroadm-device.interface.ethernet.speed |
| 20 | `ethernet-fec` | org-openroadm-device.interface.ethernet.fec |
| 21 | `ethernet-mtu` | org-openroadm-device.interface.ethernet.mtu |
| 22 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.9 — `devices_interfaces_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `description` | org-openroadm-device.interface.description |
| 4 | `administrative-state` | org-openroadm-device.interface.administrative-state |
| 5 | `operationale-state` | org-openroadm-device.interface.operational-state |
| 6 | `circuit-id` | org-openroadm-device.interface.circuit-id |
| 7 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 8 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 9 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 10 | `mc-ttp-center-freq` | org-openroadm-device.interface.mc-ttp.center-freq |
| 11 | `mc-ttp-max-freq` | org-openroadm-device.interface.mc-ttp.max-freq |
| 12 | `mc-ttp-min-freq` | org-openroadm-device.interface.mc-ttp.min-freq |
| 13 | `mc-ttp-slot-width` | org-openroadm-device.interface.mc-ttp.slot-width |
| 14 | `nmc_ctp_frequency` | org-openroadm-device.interface.nmc-ctp.frequency |
| 15 | `nmc_ctp_width` | org-openroadm-device.interface.nmc-ctp.width |
| 16 | `type` | org-openroadm-device.interface.type |
| 17 | `ethernet-auto-negotiation` | org-openroadm-device.interface.ethernet.auto-negotiation |
| 18 | `ethernet-duplex` | org-openroadm-device.interface.ethernet.duplex |
| 19 | `ethernet-speed` | org-openroadm-device.interface.ethernet.speed |
| 20 | `ethernet-fec` | org-openroadm-device.interface.ethernet.fec |
| 21 | `ethernet-mtu` | org-openroadm-device.interface.ethernet.mtu |
| 22 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.10 — `devices_interfaces_oms_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 4 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 5 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 6 | `type` | org-openroadm-device.interface.type |
| 7 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.11 — `devices_interfaces_ots_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 4 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 5 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 6 | `type` | org-openroadm-device.interface.type |
| 7 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.12 — `devices_physical_link_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `physical-link-name` | org-openroadm-device.physical-link.physical-link-name |
| 3 | `s-circuit-pack-name` | org-openroadm-device.physical-link.source.circuit-pack-name |
| 4 | `s-port-name` | org-openroadm-device.physical-link.source.port-name |
| 5 | `d-circuit-pack-name` | org-openroadm-device.physical-link.destination.circuit-pack-name |
| 6 | `d-port-name` | org-openroadm-device.physical-link.destination.port-name |
| 7 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.13 — `devices_port_parents_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 5 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 6 | `circuit-pack-mode` | org-openroadm-device.circuit-packs.circuit-pack-mode |
| 7 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 8 | `Shelf` | org-openroadm-device.circuit-packs.Shelf |
| 9 | `slot` | org-openroadm-device.circuit-packs.slot |
| 10 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 11 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 12 | `parent-circuit-pack-slot-name` | org-openroadm-device.circuit-packs.parent-circuit-pack.cp-slot-name |
| 13 | `parent-circuit-pack-name` | org-openroadm-device.circuit-packs.parent-circuit-pack.circuit-pack-name |
| 14 | `administrative-state` | org-openroadm-device.circuit-packs.ports.administrative-state |
| 15 | `circuit-id` | org-openroadm-device.circuit-packs.ports.circuit-id |
| 16 | `interface-name` | FIRST(org-openroadm-device.circuit-packs.ports.interfaces.interface-name) |
| 17 | `logical-connection-point` | org-openroadm-device.circuit-packs.ports.logical-connection-point |
| 18 | `port-direction` | org-openroadm-device.circuit-packs.ports.port-direction |
| 19 | `port-name` | org-openroadm-device.circuit-packs.ports.port-name |
| 20 | `port-qual` | org-openroadm-device.circuit-packs.ports.port-qual |
| 21 | `port-type` | org-openroadm-device.circuit-packs.ports.port-type |
| 22 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.14 — `devices_srg_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node_id` | org-openroadm-device.info.node-id |
| 2 | `openroadm_version` | org-openroadm-device.info.openroadm-version |
| 3 | `circuit_pack_name` | org-openroadm-device.shared-risk-group.circuit-packs.circuit-pack-name |
| 4 | `circuit_pack_name_index` | org-openroadm-device.shared-risk-group.circuit-packs.index |
| 5 | `srg_number` | org-openroadm-device.shared-risk-group.srg-number |
| 6 | `max_add_drop_ports` | org-openroadm-device.shared-risk-group.max-add-drop-ports |
| 7 | `current_provisioned_add_drop_ports` | org-openroadm-device.shared-risk-group.current-provisioned-add-drop-ports |
| 8 | `wavelength_duplication` | org-openroadm-device.shared-risk-group.wavelength-duplication |
| 9 | `center_freq_granularity` | org-openroadm-device.shared-risk-group.mc-capabilities.center-freq-granularity |
| 10 | `slot_width_granularity` | org-openroadm-device.shared-risk-group.mc-capabilities.slot-width-granularity |
| 11 | `mc_capabilities_max_slots` | org-openroadm-device.shared-risk-group.mc-capabilities.max-slots |
| 12 | `mc_capabilities_min_slots` | org-openroadm-device.shared-risk-group.mc-capabilities.min-slots |
| 13 | `mc_capability_profile_name` | FIRST(org-openroadm-device.shared-risk-group.mc-capability-profile-mc_capability_profile_name) |
| 14 | `lifecycle_state` | org-openroadm-device.shared-risk-group.lifecycle-state |
| 15 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.15 — `devices_shelf_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 14 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 15 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.16 — `devices_shelf_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `label` | org-openroadm-device.shelves.slots.label |
| 14 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 15 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 16 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.17 — `devices7_shelf_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `label` | org-openroadm-device.shelves.slots.label |
| 14 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 15 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 16 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.18 — `devices_degree_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (איחוד RDM)`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `degree-number` | org-openroadm-device.degree.degree-number |
| 3 | `circuit-pack-name` | org-openroadm-device.degree.connection-ports.circuit-pack-name |
| 4 | `port-name` | org-openroadm-device.degree.connection-ports.port-name |
| 5 | `max-wavelengths` | org-openroadm-device.degree.max-wavelengths |
| 6 | `center-freq-granularity` | org-openroadm-device.degree.mc-capabilities.center-freq-granularity |
| 7 | `max-slots` | org-openroadm-device.degree.mc-capabilities.max-slots |
| 8 | `min-slots` | org-openroadm-device.degree.mc-capabilities.min-slots |
| 9 | `slot-width-granularity` | org-openroadm-device.degree.mc-capabilities.slot-width-granularity |
| 10 | `otdr-port-circuit-pack-name` | org-openroadm-device.degree.otdr-port.circuit-pack-name |
| 11 | `otdr-port-port-name` | org-openroadm-device.degree.otdr-port.port-name |
| 12 | `lifecycle-state` | org-openroadm-device.degree.lifecycle-state |
| 13 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.19 — `fiber_cables_base_rdm.csv`

JSON: `FiberCables.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `name` | name |
| 2 | `tail-clfi` | fiber-cable-strand.tail-clfi |
| 3 | `strand-number` | fiber-cable-strand.strand-number |
| 4 | `allocation` | fiber-cable-strand.allocation |
| 5 | `lifecycle-state` | lifecycle-state |
| 6 | `s-clli` | source.clli |
| 7 | `s-rack` | source.rack |
| 8 | `s-shelf` | fiber-cable-strand.source.shelf |
| 9 | `s-port` | fiber-cable-strand.source.port |
| 10 | `d-clli` | destination.clli |
| 11 | `d-rack` | destination.rack |
| 12 | `d-shelf` | fiber-cable-strand.destination.shelf |
| 13 | `d-port` | fiber-cable-strand.destination.port |
| 14 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.20 — `fiber_tails.csv`

JSON: `FiberTails.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `lifecycle-state` | lifecycle-state |
| 3 | `type` | type |
| 4 | `towards-client-fiber-cable-name` | FIRST(topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 5 | `towards-client-fiber-cable-strand-number` | FIRST(topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 6 | `towards-client-type` | FIRST(topology-towards-client.tail-resource-entry.resource.type) |
| 7 | `towards-client-wiring-record-sequence-number` | FIRST(topology-towards-client.tail-resource-entry.resource.wiring-record-sequence-number) |
| 8 | `towards-client-svc-end-port-device` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-device) |
| 9 | `towards-client-svc-end-port-direction-used` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-direction-used) |
| 10 | `towards-client-svc-end-port-lgx-name` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-lgx-name) |
| 11 | `towards-client-svc-end-port-name` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-name) |
| 12 | `towards-client-svc-end-port-rack` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-rack) |
| 13 | `towards-client-svc-end-port-shelf` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-shelf) |
| 14 | `towards-network-fiber-cable-name` | FIRST(topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 15 | `towards-network-roadm-circuit-pack-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 16 | `towards-network-roadm-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 17 | `towards-network-roadm-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 18 | `towards-network-xponder-circuit-pack-name` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-circuit-pack-name) |
| 19 | `towards-network-xponder-device` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-device) |
| 20 | `towards-network-xponder-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-port-name) |
| 21 | `towards-network-svc-end-port-device` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-device) |
| 22 | `towards-network-svc-end-port-direction-used` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-direction-used) |
| 23 | `towards-network-svc-end-port-lgx-name` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-lgx-name) |
| 24 | `towards-network-svc-end-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-name) |
| 25 | `towards-network-svc-end-port-rack` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-rack) |
| 26 | `towards-network-svc-end-port-shelf` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-shelf) |
| 27 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.21 — `iofl_client.csv`

JSON: `IOFL.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `a-clli` | info.a-clli |
| 3 | `z-clli` | info.z-clli |
| 4 | `common-id` | info.common-id |
| 5 | `a-fiber-cable-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 6 | `a-fiber-cable-strand-number` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 7 | `a-roadm-faceplate-id` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id) |
| 8 | `a-roadm-circuit-pack-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 9 | `a-roadm-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-name) |
| 10 | `a-roadm-port-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name) |
| 11 | `z-fiber-cable-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 12 | `z-fiber-cable-strand-number` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 13 | `z-roadm-faceplate-id` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id) |
| 14 | `z-roadm-circuit-pack-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 15 | `z-roadm-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-name) |
| 16 | `z-roadm-port-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name) |
| 17 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.22 — `iofl_network.csv`

JSON: `IOFL.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `a-clli` | info.a-clli |
| 3 | `z-clli` | info.z-clli |
| 4 | `common-id` | info.common-id |
| 5 | `a-fiber-cable-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 6 | `a-fiber-cable-strand-number` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number) |
| 7 | `a-roadm-faceplate-id` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id) |
| 8 | `a-roadm-circuit-pack-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 9 | `a-roadm-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 10 | `a-roadm-port-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 11 | `z-fiber-cable-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 12 | `z-fiber-cable-strand-number` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number) |
| 13 | `z-roadm-faceplate-id` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id) |
| 14 | `z-roadm-circuit-pack-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 15 | `z-roadm-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 16 | `z-roadm-port-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 17 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.23 — `networks_v7_openroadm_network.csv`

JSON: `NetworksV13_network.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 3 | `node-type` | org-openroadm-common-network:node-type |
| 4 | `network-ref` | FIRST(supporting-node.network-ref) |
| 5 | `node-ref` | FIRST(supporting-node.node-ref) |
| 6 | `equipment-available` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-available) |
| 7 | `equipment-capacity` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-capacity) |
| 8 | `operational-mode-id` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.operational-mode-id) |
| 9 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.24 — `networks_v7_openroadm_topology.csv`

JSON: `NetworksV13_topology.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `tp-type` | ietf-network-topology:termination-point.org-openroadm-common-network:tp-type |
| 3 | `tp-id` | ietf-network-topology:termination-point.tp-id |
| 4 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 5 | `node-type` | org-openroadm-common-network:node-type |
| 6 | `srg-number` | org-openroadm-network-topology:srg-attributes.srg-number |
| 7 | `supporting-node-network-ref` | FIRST(supporting-node.network-ref) |
| 8 | `supporting-node-ref` | FIRST(supporting-node.node-ref) |
| 9 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.25 — `networks_v7_openroadm_otn_topology.csv`

JSON: `NetworksV13_otn_topology.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `node-type` | org-openroadm-common-network:node-type |
| 3 | `degree-number` | [חסר ב־View הסופי] |
| 4 | `tp-type` | ietf-network-topology:termination-point.org-openroadm-common-network:tp-type |
| 5 | `tp-id` | ietf-network-topology:termination-point.tp-id |
| 6 | `node-ref` | [חסר ב־View הסופי] |
| 7 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.26 — `networks_v7_ietf_network_topology.csv`

JSON: `Networkv13_ietf_network_topology.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `link-id` | link-id |
| 2 | `source-node` | source.source-node |
| 3 | `source-tp` | source.source-tp |
| 4 | `dest-node` | destination.dest-node |
| 5 | `dest-tp` | destination.dest-tp |
| 6 | `administrative-state` | org-openroadm-common-network:administrative-state |
| 7 | `clfi` | org-openroadm-common-network:clfi |
| 8 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 9 | `link-type` | org-openroadm-common-network:link-type |
| 10 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.27 — `services_base.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `lifecycle_state` | lifecycle-state |
| 4 | `service_layer` | service-layer |
| 5 | `connection_type` | connection-type |
| 6 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 7 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 8 | `a-end-clli` | service-a-end.clli |
| 9 | `a-end-optic-type` | service-a-end.optic-type |
| 10 | `a-end-service-rate` | service-a-end.service-rate |
| 11 | `a-end-rx-direction-port-circuit-pack-name` | FIRST(service-a-end.rx-direction.port.port-circuit-pack-name) |
| 12 | `a-end-rx-direction-port-device-name` | FIRST(service-a-end.rx-direction.port.port-device-name) |
| 13 | `a-end-rx-direction-port-name` | FIRST(service-a-end.rx-direction.port.port-name) |
| 14 | `a-end-rx-direction-port-rack` | FIRST(service-a-end.rx-direction.port.port-rack) |
| 15 | `a-end-rx-direction-port-shelf` | FIRST(service-a-end.rx-direction.port.port-shelf) |
| 16 | `a-end-rx-direction-port-type` | FIRST(service-a-end.rx-direction.port.port-type) |
| 17 | `a-end-tx-direction-port-circuit-pack-name` | FIRST(service-a-end.tx-direction.port.port-circuit-pack-name) |
| 18 | `a-end-tx-direction-port-device-name` | FIRST(service-a-end.tx-direction.port.port-device-name) |
| 19 | `a-end-tx-direction-port-name` | FIRST(service-a-end.tx-direction.port.port-name) |
| 20 | `a-end-tx-direction-port-rack` | FIRST(service-a-end.tx-direction.port.port-rack) |
| 21 | `a-end-tx-direction-port-shelf` | FIRST(service-a-end.tx-direction.port.port-shelf) |
| 22 | `a-end-tx-direction-port-type` | FIRST(service-a-end.tx-direction.port.port-type) |
| 23 | `z-end-clli` | service-z-end.clli |
| 24 | `z-end-optic-type` | service-z-end.optic-type |
| 25 | `z-end-service-rate` | service-z-end.service-rate |
| 26 | `z-end-rx-direction-port-circuit-pack-name` | FIRST(service-z-end.rx-direction.port.port-circuit-pack-name) |
| 27 | `z-end-rx-direction-port-device-name` | FIRST(service-z-end.rx-direction.port.port-device-name) |
| 28 | `z-end-rx-direction-port-name` | FIRST(service-z-end.rx-direction.port.port-name) |
| 29 | `z-end-rx-direction-port-rack` | FIRST(service-z-end.rx-direction.port.port-rack) |
| 30 | `z-end-rx-direction-port-shelf` | FIRST(service-z-end.rx-direction.port.port-shelf) |
| 31 | `z-end-rx-direction-port-type` | FIRST(service-z-end.rx-direction.port.port-type) |
| 32 | `z-end-tx-direction-port-circuit-pack-name` | FIRST(service-z-end.tx-direction.port.port-circuit-pack-name) |
| 33 | `z-end-tx-direction-port-device-name` | FIRST(service-z-end.tx-direction.port.port-device-name) |
| 34 | `z-end-tx-direction-port-name` | FIRST(service-z-end.tx-direction.port.port-name) |
| 35 | `z-end-tx-direction-port-rack` | FIRST(service-z-end.tx-direction.port.port-rack) |
| 36 | `z-end-tx-direction-port-shelf` | FIRST(service-z-end.tx-direction.port.port-shelf) |
| 37 | `z-end-tx-direction-port-type` | FIRST(service-z-end.tx-direction.port.port-type) |
| 38 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.28 — `services_a_2_z_topology.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `hop_type` | topology.aToZ.hop-type |
| 4 | `hop_id` | topology.aToZ.id |
| 5 | `resourceType` | topology.aToZ.resourceType.type |
| 6 | `device` | topology.aToZ.device.node-id |
| 7 | `interface_name` | topology.aToZ.resource.interface-name |
| 8 | `trib_slots` | חישוב ביניים: trib_slots |
| 9 | `opucn_trib_slots` | חישוב ביניים: opucn_trib_slots |
| 10 | `circuit_pack_name` | [חסר ב־View הסופי] |
| 11 | `port_name` | topology.aToZ.resource.port.port-name |
| 12 | `resource_service_name` | topology.aToZ.resource.service-name |
| 13 | `frequency` | topology.aToZ.resource.nmc-ctp.frequency |
| 14 | `width` | topology.aToZ.resource.nmc-ctp.width |
| 15 | `source_tail_clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 16 | `destination_tail_clf` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 17 | `odu_rate` | topology.aToZ.resource.odu.rate |
| 18 | `oducn_n_rate` | topology.aToZ.resource.odu.oducn-n-rate |
| 19 | `trib_port_number` | topology.aToZ.resource.odu.parent-odu-allocation.trib-port-number |
| 20 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.29 — `services_z_2_a_topology.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `hop_type` | topology.zToA.hop-type |
| 4 | `hop_id` | topology.zToA.id |
| 5 | `resourceType` | topology.zToA.resourceType.type |
| 6 | `device` | topology.zToA.device.node-id |
| 7 | `interface_name` | topology.zToA.resource.interface-name |
| 8 | `trib_slots` | חישוב ביניים: trib_slots |
| 9 | `opucn_trib_slots` | חישוב ביניים: opucn_trib_slots |
| 10 | `circuit_pack_name` | [חסר ב־View הסופי] |
| 11 | `port_name` | topology.zToA.resource.port.port-name |
| 12 | `resource_service_name` | topology.zToA.resource.service-name |
| 13 | `frequency` | topology.zToA.resource.nmc-ctp.frequency |
| 14 | `width` | topology.zToA.resource.nmc-ctp.width |
| 15 | `source_tail_clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 16 | `destination_tail_clf` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 17 | `odu_rate` | topology.zToA.resource.odu.rate |
| 18 | `oducn_n_rate` | topology.zToA.resource.odu.oducn-n-rate |
| 19 | `trib_port_number` | topology.zToA.resource.odu.parent-odu-allocation.trib-port-number |
| 20 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.30 — `services_a_2_z_network_topology.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 4 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 5 | `id` | network-topology.a-to-z.id |
| 6 | `network-resource-type` | network-topology.a-to-z.network-resource-type |
| 7 | `a-z-tp-id` | network-topology.a-to-z.network-resource.tp-id |
| 8 | `a-z-tp-node-id` | network-topology.a-to-z.network-resource.tp-node-id |
| 9 | `a-z-link-id` | network-topology.a-to-z.network-resource.link-id |
| 10 | `a-z-link-network-id` | network-topology.a-to-z.network-resource.link-network-id |
| 11 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.31 — `services_z_2_a_network_topology.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 4 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 5 | `id` | network-topology.z-to-a.id |
| 6 | `network-resource-type` | network-topology.z-to-a.network-resource-type |
| 7 | `z-a-tp-id` | network-topology.z-to-a.network-resource.tp-id |
| 8 | `z-a-tp-node-id` | network-topology.z-to-a.network-resource.tp-node-id |
| 9 | `z-a-link-id` | network-topology.z-to-a.network-resource.link-id |
| 10 | `z-a-link-network-id` | network-topology.z-to-a.network-resource.link-network-id |
| 11 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

### 3.32 — `services_otn.csv`

JSON: `Services.json`

| # | עמודת CSV | מקור / כלל |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `supporting_service_name` | supporting-service-name |
| 4 | `etl_hash_id` | HASH של ערכי השדות בשלב החישוב |

## פערים בקוד שצריך להפריד מכללים עסקיים

אלה ממצאי קריאה סטטית; השפעתם על נתונים אמיתיים לא נבדקה בהרצה. לא בוצע שינוי בקוד.

| מקום | ממצא | משמעות |
|---|---|---|
| חילוץ קלט | כמה התאמות לשם כותבות לאותו קובץ | סיכון לדריסה במקום צירוף |
| `devices_circuit_packs_cp_rdm.csv` | ה־View מייצר `Shelf`, הייצוא מבקש `shelf` | העמודה המבוקשת אינה קיימת ב־View |
| `devices7_circuit_pack_xpdr.csv` | ה־View משמר `Shelf`, הייצוא מבקש `shelf`; המקור עצמו נקרא `circuit-packs.Shelf` | גם הבדל בשם הייצוא וגם נתיב מקור שכדאי לאמת |
| `devices_port_parents_rdm.csv` | מקור `Shelf` נקרא באות גדולה, בניגוד למסלולים אחרים שקוראים `shelf` | ייתכן שדה חסר, תלוי בנתוני המקור |
| `services_a_2_z_topology.csv` וגם `services_z_2_a_topology.csv` | נוצר `circuit_pack_name`, אבל ה־project הסופי שומר `circuit_pack_ame` | `circuit_pack_name` המבוקש בייצוא נשמט |
| `networks_v7_openroadm_otn_topology.csv` | הייצוא מבקש `degree-number` ו־`node-ref`, שאינם ב־View הסופי | אי־התאמת schema |
| ייצוא רשתות | שמות v7, מקור V13 | אין לפרש את גרסת הקלט משם הפלט |
| ממשקים | העמודה נקראת `operationale-state` | זה האיות בפלט הקיים; המקור `operational-state` |
| מסלולי שירות | `destination_tail_clf` | זה האיות בפלט הקיים, ללא i בסוף |
| hash | ערכים מחוברים ללא מפריד, ובחלק מה־Views נכללים גם שדות שאינם מיוצאים | hash אינו מפתח ייחודי, ואינו בהכרח hash של עמודות CSV בלבד |

### עמודות חסרות שנמצאו במעקב אחר ה־project

| CSV | עמודה | ממצא |
|---|---|---|
| devices7_circuit_pack_xpdr.csv | shelf | [חסר ב־View הסופי] |
| devices_circuit_packs_cp_rdm.csv | shelf | [חסר ב־View הסופי] |
| networks_v7_openroadm_otn_topology.csv | degree-number | [חסר ב־View הסופי] |
| networks_v7_openroadm_otn_topology.csv | node-ref | [חסר ב־View הסופי] |
| services_a_2_z_topology.csv | circuit_pack_name | [חסר ב־View הסופי] |
| services_z_2_a_topology.csv | circuit_pack_name | [חסר ב־View הסופי] |

## מה כבר אומת בקלט ומה עדיין פתוח

הדוח המקומי מצא 310 מסמכי DevicesV2deployed, ‏17,882 מסמכי Tail, ‏2,095 מסמכי IOFL ו־4 רשומות network-list ב־NetworksV13. אלה ספירות קלט, לא פלט. במבנים פנימיים נדגם רק האיבר הראשון; פירוט חלק מהקבצים נחתך. אין מהדוח הוכחה שכל השדות קיימים בכל הרשומות או שכל קשר ניתן לפתרון.

אין עדיין ספירת CSV בפועל, בדיקת כפילויות, אימות טיפוסים לכל השדות או השוואת לפני/אחרי על רשומות אמיתיות. יש לאשר עם בעלי הנתונים שהשמטת קבצים/שדות ובחירת FIRST הן דרישות מכוונות.

## מקורות

- [סדר הריצה, קלט ועמודות הייצוא](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/do-all.sh)
- [עיבוד ציוד](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js)
- [עיבוד כבלים](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_cables.js)
- [עיבוד tails](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_tails.js)
- [עיבוד IOFL](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js)
- [עיבוד רשתות](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js)
- [עיבוד שירותים](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js)
- [דוח הארכיון המקומי](https://github.com/adarcook/etl-vnc/issues/2)