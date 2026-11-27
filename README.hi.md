# 🐧 डेवलपर्स और DevOps के लिए Linux

Unix/Linux शुरू से सीखने और Linux, Shell Scripting व DevOps इंटरव्यू की तैयारी के लिए स्टडी किट।

![Unix Overview](unix-1.png)

---

## 🎯 यह किसके लिए है

- **डेवलपर्स** जिन्हें Linux सर्वर, कंटेनर और CI runners पर आराम से काम करना है।
- **DevOps / SRE उम्मीदवार** जो इंटरव्यू या जॉब स्विच की तैयारी कर रहे हैं।
- **छात्र** जो Unix/Linux Programming कोर्स कर रहे हैं (सामग्री एक मानक यूनिवर्सिटी सिलेबस से मेल खाती है)।

---

## 📁 रिपॉज़िटरी की सामग्री

| फ़ाइल | प्रकार | पेज | इसमें क्या है |
| :--- | :--- | :---: | :--- |
| [Unix and Linux Programming C_Final.pdf](Unix%20and%20Linux%20Programming%20C_Final.pdf) | कोर्स बुक | 340 | पूरी पाठ्यपुस्तक: OS परिचय, प्रोसेस, कमांड्स, vi और shell programming, sed और awk |
| [Unix_syllbus.pdf](Unix_syllbus.pdf) | सिलेबस | 5 | मॉड्यूल-वार सिलेबस (मॉड्यूल I–VI), प्रगति चेकलिस्ट के रूप में उपयोगी |
| [Linux Interview Questions.pdf](Linux%20Interview%20Questions.pdf) | इंटरव्यू प्रश्नोत्तर | 132 | **भाग I – 60 प्रश्न**: बेसिक्स, फ़ाइल परमिशन, SSH, नेटवर्किंग, प्रोसेस, सर्विसेज़, रीडायरेक्शन, मॉनिटरिंग, ऑटोमेशन |
| [70 Linux Questions Part2.pdf](70%20Linux%20Questions%20Part2.pdf) | इंटरव्यू प्रश्नोत्तर | 134 | **भाग II – 70 प्रश्न** MCQ, केस-स्टडी, ट्रबलशूटिंग, वैचारिक और सही/गलत प्रारूपों में |
| [Shell Scripting Questions.pdf](Shell%20Scripting%20Questions.pdf) | इंटरव्यू प्रश्नोत्तर | 101 | **50 shell scripting प्रश्न** "What is a shell?" से आगे तक |
| [applicaitons of unix sysetem.md](applicaitons%20of%20unix%20sysetem.md) | नोट्स | — | प्रोडक्शन में Linux कहाँ चलता है (Nginx, EC2, Docker, cron, CI/CD), सीनियर इंजीनियरों को किन स्किल्स की ज़रूरत है, और एक प्रोडक्शन चीट शीट |
| [unix-1.png](unix-1.png) | डायग्राम | — | Unix का अवलोकन |
| [unix file structure.png](unix%20file%20structure.png) | डायग्राम | — | Unix/Linux फ़ाइलसिस्टम पदानुक्रम |
| [job-scheduling-in-unix.png](job-scheduling-in-unix.png) | डायग्राम | — | जॉब शेड्यूलिंग (`cron`, `at`, `batch`) |
| [unix-shell-scripting (1).png](unix-shell-scripting%20(1).png) | डायग्राम | — | Shell scripting का अवलोकन |

---

## 🗺️ सुझाया गया लर्निंग पाथ

1. **बुनियाद** → कोर्स बुक का मॉड्यूल I [फ़ाइलसिस्टम डायग्राम](unix%20file%20structure.png) के साथ पढ़ें।
2. **प्रोसेस और जॉब्स** → मॉड्यूल II और साथ में [जॉब शेड्यूलिंग डायग्राम](job-scheduling-in-unix.png)।
3. **रोज़मर्रा की कमांड्स** → मॉड्यूल III: नेविगेशन, फ़ाइलें, फ़िल्टर, पाइप, परमिशन, लिंक।
4. **vi और shell scripting** → मॉड्यूल IV, फिर *Shell Scripting Questions* हल करें।
5. **टेक्स्ट प्रोसेसिंग** → मॉड्यूल V: `sed` और `awk`।
6. **वास्तविक संदर्भ** → थ्योरी को सर्वर, कंटेनर और CI/CD से जोड़ने के लिए [Unix सिस्टम्स के अनुप्रयोग](applicaitons%20of%20unix%20sysetem.md) पढ़ें।
7. **इंटरव्यू अभ्यास** → Linux Interview Questions भाग I, फिर भाग II (केस स्टडी और ट्रबलशूटिंग)।

---

## 📖 सिलेबस का अवलोकन

| मॉड्यूल | विषय | मुख्य अवधारणाएँ |
| :---: | :--- | :--- |
| **I** | परिचय | OS की बुनियादी बातें, GNU का इतिहास, Unix परिवार, लेयर्ड आर्किटेक्चर, शेल (Bourne, Bash, Korn, C), absolute/relative पाथ, फ़ाइलसिस्टम संरचना, inode, CUI बनाम GUI, Linux बूट प्रक्रिया, X Window, GNOME और KDE |
| **II** | प्रोसेस | प्रोसेस की अवस्थाएँ और बदलाव, प्रोसेस context, foreground/background जॉब्स, जॉब कंट्रोल, suspend/interrupt/kill, `at` और `batch` से शेड्यूलिंग |
| **III** | Unix/Linux कमांड्स | लॉगिन/लॉगआउट, internal बनाम external कमांड्स, `cd`/`mkdir`/`touch`/`cat`/`cp`/`mv`/`rm`, फ़िल्टर और पाइप (`head`, `tail`, `wc`, `sort`, `cut`, `grep`, `diff`, `uniq`), `expr`/`bc`, `man`, वाइल्डकार्ड, रीडायरेक्शन, परमिशन, hard और symbolic लिंक |
| **IV** | vi एडिटर और Shell Programming | vi मोड, एडिटिंग, खोजें और बदलें; वेरिएबल, environment वेरिएबल, `read`/`echo`, positional parameters, `set`/`shift`, ऑपरेटर, `test`, `if`/`case`, `while`/`until`/`for` |
| **V** | sed और awk | रेगुलर एक्सप्रेशन, sed addressing, insert/delete/print, substitution, sed स्क्रिप्ट; awk records और fields, `print`/`printf` |
| **VI** | सिस्टम एडमिनिस्ट्रेशन | यूज़र जोड़ना/हटाना, स्टार्टअप और शटडाउन, डिस्क मैनेजमेंट, mounting/unmounting, सिस्टम उपयोग की मॉनिटरिंग, सिस्टम सुरक्षा |

> मॉड्यूल VI केवल सिलेबस में है; कोर्स बुक मॉड्यूल I–V को कवर करती है।

---

## 💼 इंटरव्यू की तैयारी

तीन सेट में **180 प्रश्न**:

| सेट | संख्या | प्रारूप | विषय |
| :--- | :---: | :--- | :--- |
| Linux Interview Questions – भाग I | 60 | प्रश्नोत्तर | Linux बेसिक्स, फ़ाइल परमिशन, SSH, नेटवर्किंग, सर्विसेज़, रीडायरेक्शन, प्रोसेस, सिस्टम मॉनिटरिंग, ऑटोमेशन |
| Linux Questions – भाग II | 70 | MCQ, केस स्टडी, ट्रबलशूटिंग, वैचारिक, सही/गलत | वही विषय, ज़्यादा कठिन और परिदृश्य-आधारित |
| Shell Scripting Questions | 50 | प्रश्नोत्तर | शेल अवधारणाएँ, वेरिएबल, कंडीशन, लूप, स्क्रिप्टिंग अभ्यास |

**सुझाव:** हर प्रश्न का उत्तर पढ़ने *से पहले* उसे ज़ोर से बोलकर दें, फिर कमांड को असली Linux मशीन (WSL, VM, या `docker run -it ubuntu bash`) पर चलाएँ।

---

## 🖼️ विज़ुअल नोट्स

| फ़ाइलसिस्टम संरचना | जॉब शेड्यूलिंग | Shell Scripting |
| :---: | :---: | :---: |
| ![Unix File Structure](unix%20file%20structure.png) | ![Job Scheduling](job-scheduling-in-unix.png) | ![Shell Scripting](unix-shell-scripting%20(1).png) |

---

## ⚡ त्वरित कमांड संदर्भ

```bash
# सिस्टम हेल्थ
htop                      # लाइव CPU / मेमोरी / प्रोसेस
df -h                     # डिस्क उपयोग
free -h                   # मेमोरी उपयोग
ps aux | grep node        # कोई प्रोसेस ढूँढें

# लॉग्स
tail -f /var/log/nginx/error.log
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head

# नेटवर्किंग
lsof -i :8080             # पोर्ट 8080 कौन इस्तेमाल कर रहा है
curl -Iv https://example.com
netstat -tulpn            # सुनने वाले पोर्ट (या: ss -tulpn)

# परमिशन
chmod 600 ~/.ssh/id_rsa
chown -R www-data:www-data /var/www/html

# शेड्यूलिंग
crontab -e                # दोहराए जाने वाले जॉब्स
echo "backup.sh" | at 02:00   # एक बार का जॉब
```

और जानकारी [Unix सिस्टम्स के अनुप्रयोग → प्रोडक्शन चीट शीट](applicaitons%20of%20unix%20sysetem.md#4-production-cheat-sheet-for-senior-developers) में।

---

## 🤝 योगदान

योगदान का स्वागत है: नए नोट्स, चीट शीट, स्क्रिप्ट या प्रश्न सेट।

1. रिपॉज़िटरी को Fork करें।
2. एक ब्रांच बनाएँ: `git checkout -b add-networking-notes`
3. अपने बदलाव commit करें और pull request खोलें।

---

## 📄 लाइसेंस

[MIT License](LICENSE) के तहत जारी। साथ दिए गए PDF तृतीय-पक्ष अध्ययन सामग्री हैं और अपने-अपने लेखकों व प्रकाशकों की संपत्ति बने रहते हैं। उदाहरण के लिए, कोर्स बुक © Amity University Press है।

---

⭐ अगर यह आपकी Linux या DevOps यात्रा में मदद करे, तो रिपो को star देने पर विचार करें!
