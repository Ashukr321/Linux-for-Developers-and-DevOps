# प्रोडक्शन में Unix/Linux

वेब सर्वर, क्लाउड VM, Docker, cron और CI/CD में Linux का उपयोग, सीनियर इंजीनियरों के लिए ज़रूरी स्किल्स और एक प्रोडक्शन चीट शीट।

## 1. कार्यकारी अवलोकन: Unix/Linux इंटरनेट को क्यों चलाता है

Unix और Unix-जैसे ऑपरेटिंग सिस्टम (जैसे Ubuntu, Debian, RHEL, Amazon Linux, Alpine) वैश्विक क्लाउड इन्फ्रास्ट्रक्चर और प्रोडक्शन सर्वरों की नींव हैं। टॉप 10 लाख वेब सर्वरों में से 90% से अधिक और टॉप 500 सुपरकंप्यूटरों में से 100% Linux/Unix kernel पर चलते हैं।

---

## 2. क्लाउड और इन्फ्रास्ट्रक्चर में प्रोडक्शन उपयोग

### 🌐 A. वेब सर्वर और रिवर्स प्रॉक्सी (Nginx और Apache)
- **Nginx प्रोसेस मैनेजमेंट**: Nginx मूल रूप से Unix daemon (`systemd`) के रूप में चलता है और non-blocking asynchronous requests के लिए Unix event-driven आर्किटेक्चर (Linux पर `epoll`, BSD पर `kqueue`) का उपयोग करता है।
- **प्रोडक्शन कमांड्स**:
  - `systemctl status nginx` / `systemctl restart nginx` — सर्वर प्रोसेस की स्थिति प्रबंधित करें।
  - `tail -f /var/log/nginx/error.log` — प्रोडक्शन error logs को लाइव स्ट्रीम करें।
  - `nginx -t` — प्रोडक्शन ट्रैफ़िक reload करने से पहले कॉन्फ़िगरेशन सिंटैक्स टेस्ट करें।

### ☁️ B. क्लाउड वर्चुअल मशीनें (AWS EC2 / GCP Compute / Azure VMs)
- **EC2 इंस्टेंस प्रोविज़निंग**: क्लाउड इंस्टेंस (जैसे AWS EC2 `t3.micro` या `c6i.xlarge`) Unix-आधारित OS डिस्ट्रीब्यूशन (Amazon Linux 2023, Ubuntu Server) चलाते हैं।
- **SSH एक्सेस और ऑथेंटिकेशन**: Secure shell प्रोटोकॉल (`ssh -i key.pem ubuntu@ec2-ip`) रिमोट एडमिनिस्ट्रेशन के लिए Unix public-private key क्रिप्टोग्राफी (`chmod 400 key.pem`) का उपयोग करता है।
- **Environment Variables**: प्रोडक्शन secrets (`.env`, `AWS_ACCESS_KEY`) Unix environment variables (`export KEY=VALUE`) और `systemd` सर्विस फ़ाइलों के ज़रिए प्रबंधित होते हैं।

### 🐳 C. Docker कंटेनर और माइक्रोसर्विसेज़
- **Linux Kernel की नींव**: Docker, Linux kernel primitives पर निर्भर है:
  - **Namespaces**: प्रोसेस आइसोलेशन देते हैं (PID, Network, Mount)।
  - **Cgroups (Control Groups)**: कंटेनरों के लिए CPU/RAM मेमोरी सीमाएँ तय और मापते हैं।
- **Alpine Linux कंटेनर इमेज**: हल्की 5MB Unix बेस इमेज, जिनका उपयोग तेज़ CI/CD डिप्लॉयमेंट के लिए Node.js, Python और Go माइक्रोसर्विसेज़ को पैकेज करने में होता है।

### ⚙️ D. टास्क शेड्यूलिंग और CI/CD पाइपलाइन
- **Cron Jobs (`crontab -e`)**: प्रोडक्शन सर्वरों पर डेटाबेस बैकअप, लॉग रोटेशन, क्लीनअप टास्क और रात्रिकालीन रिपोर्ट बनाना स्वचालित करता है।
- **CI/CD Runners**: GitHub Actions, GitLab CI और Jenkins runners बिल्ड कमांड्स को Linux bash वातावरण (`/bin/bash`) में चलाते हैं।

---

## 3. सीनियर सॉफ़्टवेयर इंजीनियरों के लिए Unix/Linux क्यों ज़रूरी है

| सीनियर क्षमता | Unix/Linux स्किल्स क्यों अनिवार्य हैं | मुख्य कमांड्स / टूल्स |
| :--- | :--- | :--- |
| **प्रोडक्शन डीबगिंग और इंसिडेंट रिस्पॉन्स** | जब सर्वर क्रैश होता है या हाई latency आती है, तब कोई GUI नहीं होता। सीनियर डेवलपर्स सीधे इंस्टेंस में SSH करके लाइव मेट्रिक्स जाँचते हैं और क्रैश ठीक करते हैं। | `top`, `htop`, `ps aux`, `df -h`, `free -m` |
| **लॉग एनालिसिस और रूट कॉज़ एनालिसिस** | आउटेज के दौरान लाखों लॉग लाइनों को पार्स करके stack traces या 5xx HTTP errors को जल्दी अलग करना। | `grep`, `awk`, `sed`, `tail`, `less` |
| **नेटवर्क और कनेक्टिविटी ट्रबलशूटिंग** | माइक्रोसर्विसेज़ के बीच API कनेक्शन फ़ेलियर, ब्लॉक पोर्ट या DNS गलत कॉन्फ़िगरेशन को सुलझाना। | `curl -v`, `netstat -tulpn`, `lsof -i`, `dig`, `traceroute` |
| **सुरक्षा और एक्सेस कंट्रोल** | सख्त फ़ाइल परमिशन और SSH key hygiene लागू करके डेटा लीक रोकना। | `chmod`, `chown`, `ufw`, `iptables`, `ssh-keygen` |
| **DevOps और इन्फ्रास्ट्रक्चर पैरिटी** | लोकल Unix Docker कंटेनरों और क्लाउड EC2 वातावरण के बीच समानता बनाए रखकर "it works on my machine" बग्स खत्म करना। | `bash`, `environment variables`, `systemd` |

---

## 4. सीनियर डेवलपर्स के लिए प्रोडक्शन चीट शीट

### 📊 सिस्टम रिसोर्स और हेल्थ मॉनिटरिंग
```bash
# लाइव CPU, मेमोरी और प्रोसेस उपयोग मॉनिटर करें
htop

# डिस्क स्पेस उपयोग जाँचें
df -h

# RAM मेमोरी उपयोग MB/GB में जाँचें
free -h

# नाम से फ़िल्टर करके चल रहे प्रोसेस जाँचें
ps aux | grep node
```

### 🔍 लॉग निरीक्षण और टेक्स्ट प्रोसेसिंग
```bash
# 500 status codes के लिए फ़िल्टर किए गए प्रोडक्शन लॉग लाइव स्ट्रीम करें
tail -f /var/log/nginx/access.log | grep "HTTP/1.1\" 5"

# access log में सबसे ज़्यादा रिक्वेस्ट करने वाले IP पतों की गिनती करें
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10
```

### 🌐 नेटवर्क और सॉकेट डीबगिंग
```bash
# जाँचें कि पोर्ट 8080 किस प्रोसेस ने घेर रखा है
lsof -i :8080

# TCP सॉकेट कनेक्शन टेस्ट करें और headers देखें
curl -Iv https://api.example.com/healthcheck

# सक्रिय listening पोर्ट और स्थापित नेटवर्क कनेक्शन देखें
netstat -tulpn
```

### 🔐 सुरक्षा और परमिशन
```bash
# SSH private key की परमिशन सीमित करें (SSH client के लिए अनिवार्य)
chmod 600 ~/.ssh/id_rsa

# owner को read/write/execute, group और others को read/execute दें
chmod 755 /var/www/html

# फ़ाइल ownership को Nginx यूज़र में बदलें
chown -R www-data:www-data /var/www/html
```
