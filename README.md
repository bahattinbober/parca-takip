# Parça Takip Sistemi - Kurulum (Çoklu Dükkan)

## Gereksinimler
- Node.js (v18+) yüklü olmalı: https://nodejs.org

## Kurulum ve Çalıştırma
1. Bu klasörü bilgisayara/sunucuya kopyala
2. Terminalde bu klasöre gir: `cd parca-takip`
3. Paketleri kur: `npm install`
4. `.env.example` dosyasını `.env` olarak kopyala ve içindeki `JWT_SECRET`
   değerini rastgele, tahmin edilemez bir metinle değiştir:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   çıktısını `.env` dosyasındaki `JWT_SECRET=` satırına yapıştır.
5. (İsteğe bağlı) Örnek verilerle "demo" dükkanı oluştur:
   `node seed.js` (kullanıcı adı: `demo`, şifre: `demo1234`)
6. Sunucuyu başlat: `node server.js`
7. Tarayıcıdan aç: http://localhost:3000/login.html
   (Aynı ağdaki başka cihazlardan erişmek için bilgisayarın yerel IP
   adresini kullan, örn: http://192.168.1.5:3000/login.html)

## Yeni bir dükkan ekleme
Her dükkanın kendi kullanıcı adı/şifresi ve kendi ayrı parça verisi olur.
Yeni bir dükkan eklemek için:

```
node create-tenant.js "Dükkan Adı" kullaniciadi sifre123
```

Parametreleri boş bırakırsan araç sırayla dükkan adı, kullanıcı adı ve
şifreyi soracaktır:

```
node create-tenant.js
```

Bu komut:
- `data/tenants.json` içine dükkanın bilgilerini ekler (şifre bcryptjs
  ile hashlenmiş olarak saklanır, düz metin şifre hiçbir yerde tutulmaz)
- `data/tenants/<tenant-id>/parts.json` adında o dükkana özel, boş bir
  parça veri dosyası oluşturur

Dükkanın parça verilerini bu JSON dosyasını elle düzenleyerek ya da
(ileride eklenecek) bir veri girişi ekranıyla doldurabilirsin. Format
`seed.js` içindeki örnek verilerle aynıdır.

## Giriş sistemi
- Giriş sayfası: `login.html`. Kullanıcı adı/şifre `/api/login`
  endpointine gönderilir, doğrulanınca JWT (JSON Web Token) üretilir.
- Token tarayıcıda `localStorage`'da tutulur ve her API isteğinde
  `Authorization: Bearer <token>` başlığıyla gönderilir.
- Token içinde hangi dükkana (tenant) ait olduğu bilgisi bulunur; sunucu
  bu sayede her dükkanı sadece kendi verisiyle sınırlar. Bir dükkanın
  kullanıcısı başka bir dükkanın verisini göremez.
- Token'lar 12 saat sonra geçersiz olur, kullanıcı tekrar giriş yapmalı.

## Barkod/QR okutma
- Fiziksel USB barkod okuyucu varsa: input kutusuna tıkla, okut,
  otomatik Enter'a basıp arama yapar.
- Telefon/tablet kamerasıyla: "Kamera ile QR/Barkod Okut" butonuna bas.

## Nasıl çalışıyor
- Her parçanın tek bir ana kodu var (örn. FB-1001).
- Bu kod okutulduğunda tek ekranda şunlar geliyor:
  1. Hangi çekmecede olduğu
  2. Bağlı alt kodlar (varyantlar)
  3. Güncel stok adedi
  4. Bugüne kadar takıldığı araçların plakaları

## Veri yapısı
```
data/
  tenants.json                     <- dükkan hesapları (kullanıcı adı, şifre hash'i, dükkan adı)
  tenants/
    <tenant-id>/
      parts.json                   <- o dükkana özel parça verileri
```

## Notlar
- Veriler JSON dosyalarında tutuluyor - küçük/orta ölçekli, tek sunucu
  kurulumu için yeterli. İleride eş zamanlı çok kullanıcı/yazma yoğun
  senaryolar için PostgreSQL gibi bir veritabanına geçilebilir.
- `.env` dosyası (özellikle `JWT_SECRET`) asla paylaşılmamalı veya
  versiyon kontrolüne eklenmemeli.
- Kalıcı barındırma (7/24, internetten erişim) için Railway, Render
  gibi ücretsiz planı olan servislere deploy edilebilir.
- Kod eşleşmezse "Bu koda ait parça bulunamadı" uyarısı çıkar.
