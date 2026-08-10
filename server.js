require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { readJson, writeJson, findTenantByUsername, getTenantPartsFile } = require('./lib/tenants');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    'HATA: JWT_SECRET tanımlı değil. Lütfen .env.example dosyasını .env olarak kopyalayıp ' +
      'içindeki JWT_SECRET değerini ayarlayın.'
  );
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Giriş: kullanıcı adı + şifre doğrulanır, dükkana özel JWT üretilir
app.post('/api/login', async (req, res) => {
  const { kullaniciAdi, sifre } = req.body || {};

  if (!kullaniciAdi || !sifre) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
  }

  const tenant = findTenantByUsername(kullaniciAdi);
  if (!tenant) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const sifreDogru = await bcrypt.compare(sifre, tenant.sifreHash);
  if (!sifreDogru) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  const token = jwt.sign(
    { tenantId: tenant.id, kullaniciAdi: tenant.kullaniciAdi, dukkanAdi: tenant.dukkanAdi },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, dukkanAdi: tenant.dukkanAdi });
});

// JWT doğrulama: geçerli tokenı olmayan istekler API'ye erişemez
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Giriş yapılmamış.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.' });
  }
}

// Ana endpoint: kod okutulunca 4 bilgiyi tek seferde döndürür (sadece kendi dükkanının verisi)
app.get('/api/lookup/:kod', requireAuth, (req, res) => {
  const { kod } = req.params;
  const parts = readJson(getTenantPartsFile(req.user.tenantId));
  const part = parts.find((p) => p.kod.toLowerCase() === kod.toLowerCase());

  if (!part) {
    return res.status(404).json({ error: 'Bu koda ait parça bulunamadı.' });
  }

  res.json(part);
});

// Basit liste endpointi (test/demo amaçlı, dükkanın tüm kodlarını görmek için)
app.get('/api/parts', requireAuth, (req, res) => {
  const parts = readJson(getTenantPartsFile(req.user.tenantId));
  const list = parts.map(({ kod, isim, cekmece, stok_adedi }) => ({ kod, isim, cekmece, stok_adedi }));
  res.json(list);
});

// Yeni parça ekler
app.post('/api/parts', requireAuth, (req, res) => {
  const { kod, isim, cekmece, stok_adedi, alt_kodlar, takildigi_araclar } = req.body || {};

  if (!kod || !isim || !cekmece || stok_adedi === undefined || stok_adedi === null) {
    return res.status(400).json({ error: 'kod, isim, cekmece ve stok_adedi alanları zorunlu.' });
  }

  const partsFile = getTenantPartsFile(req.user.tenantId);
  const parts = readJson(partsFile);

  if (parts.some((p) => p.kod.toLowerCase() === kod.toLowerCase())) {
    return res.status(409).json({ error: 'Bu koda sahip bir parça zaten mevcut.' });
  }

  const yeniParca = {
    kod,
    isim,
    cekmece,
    stok_adedi: Number(stok_adedi) || 0,
    alt_kodlar: Array.isArray(alt_kodlar) ? alt_kodlar : [],
    takildigi_araclar: Array.isArray(takildigi_araclar) ? takildigi_araclar : [],
  };

  parts.push(yeniParca);
  writeJson(partsFile, parts);

  res.status(201).json(yeniParca);
});

// Var olan parçayı günceller (tüm alanlar)
app.put('/api/parts/:kod', requireAuth, (req, res) => {
  const { kod } = req.params;
  const { kod: yeniKod, isim, cekmece, stok_adedi, alt_kodlar, takildigi_araclar } = req.body || {};

  if (!yeniKod || !isim || !cekmece || stok_adedi === undefined || stok_adedi === null) {
    return res.status(400).json({ error: 'kod, isim, cekmece ve stok_adedi alanları zorunlu.' });
  }

  const partsFile = getTenantPartsFile(req.user.tenantId);
  const parts = readJson(partsFile);
  const index = parts.findIndex((p) => p.kod.toLowerCase() === kod.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Bu koda ait parça bulunamadı.' });
  }

  const kodDegisiyor = yeniKod.toLowerCase() !== kod.toLowerCase();
  if (kodDegisiyor && parts.some((p) => p.kod.toLowerCase() === yeniKod.toLowerCase())) {
    return res.status(409).json({ error: 'Bu koda sahip başka bir parça zaten mevcut.' });
  }

  const guncelParca = {
    kod: yeniKod,
    isim,
    cekmece,
    stok_adedi: Number(stok_adedi) || 0,
    alt_kodlar: Array.isArray(alt_kodlar) ? alt_kodlar : [],
    takildigi_araclar: Array.isArray(takildigi_araclar) ? takildigi_araclar : [],
  };

  parts[index] = guncelParca;
  writeJson(partsFile, parts);

  res.json(guncelParca);
});

// Parçayı siler
app.delete('/api/parts/:kod', requireAuth, (req, res) => {
  const { kod } = req.params;
  const partsFile = getTenantPartsFile(req.user.tenantId);
  const parts = readJson(partsFile);
  const index = parts.findIndex((p) => p.kod.toLowerCase() === kod.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Bu koda ait parça bulunamadı.' });
  }

  const [silinen] = parts.splice(index, 1);
  writeJson(partsFile, parts);

  res.json(silinen);
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
