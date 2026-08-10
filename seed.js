// "demo" adlı örnek bir dükkan oluşturur (yoksa) ve örnek parça verileriyle doldurur.
// Gerçek dükkanlar için node create-tenant.js kullanın.

const bcrypt = require('bcryptjs');
const fs = require('fs');
const {
  readTenants,
  writeTenants,
  findTenantByUsername,
  getTenantDir,
  getTenantPartsFile,
  writeJson,
} = require('./lib/tenants');

const DEMO_ID = 'demo';
const DEMO_DUKKAN_ADI = 'Demo Dükkan';
const DEMO_KULLANICI_ADI = 'demo';
const DEMO_SIFRE = 'demo1234';

async function ensureDemoTenant() {
  if (findTenantByUsername(DEMO_KULLANICI_ADI)) {
    console.log(`"${DEMO_KULLANICI_ADI}" kullanıcısı zaten mevcut, tenant kaydı atlanıyor.`);
    return;
  }

  const tenants = readTenants();
  const sifreHash = await bcrypt.hash(DEMO_SIFRE, 10);
  tenants.push({
    id: DEMO_ID,
    dukkanAdi: DEMO_DUKKAN_ADI,
    kullaniciAdi: DEMO_KULLANICI_ADI,
    sifreHash,
    olusturmaTarihi: new Date().toISOString(),
  });
  writeTenants(tenants);
  console.log(`Demo tenant oluşturuldu (kullanıcı adı: ${DEMO_KULLANICI_ADI}, şifre: ${DEMO_SIFRE}).`);
}

function seedDemoParts() {
  fs.mkdirSync(getTenantDir(DEMO_ID), { recursive: true });

  const parts = [
    {
      kod: 'FB-1001',
      isim: 'Ön Fren Balatası - Bosch',
      cekmece: 'A-Reyonu / 3. Çekmece',
      stok_adedi: 12,
      alt_kodlar: [
        { alt_kod: 'FB-1001-L', aciklama: 'Sol taraf uyumlu' },
        { alt_kod: 'FB-1001-R', aciklama: 'Sağ taraf uyumlu' },
        { alt_kod: 'FB-1001-EU', aciklama: 'Avrupa modelleri için varyant' },
      ],
      takildigi_araclar: [
        { plaka: '35 ABC 123', tarih: '2026-05-12', km: 87000 },
        { plaka: '35 XYZ 456', tarih: '2026-06-03', km: 45200 },
        { plaka: '20 DEF 789', tarih: '2026-07-21', km: 112000 },
      ],
    },
    {
      kod: 'YF-2050',
      isim: 'Motor Yağ Filtresi - Mann',
      cekmece: 'B-Reyonu / 1. Çekmece',
      stok_adedi: 34,
      alt_kodlar: [
        { alt_kod: 'YF-2050-D', aciklama: 'Dizel motor varyantı' },
        { alt_kod: 'YF-2050-B', aciklama: 'Benzinli motor varyantı' },
      ],
      takildigi_araclar: [
        { plaka: '35 ABC 123', tarih: '2026-05-12', km: 87000 },
        { plaka: '35 QWE 321', tarih: '2026-04-02', km: 63000 },
      ],
    },
    {
      kod: 'AK-3300',
      isim: '60Ah Akü - Varta',
      cekmece: 'C-Reyonu / Zemin',
      stok_adedi: 5,
      alt_kodlar: [],
      takildigi_araclar: [{ plaka: '35 MNO 654', tarih: '2026-03-15', km: 95000 }],
    },
  ];

  writeJson(getTenantPartsFile(DEMO_ID), parts);
  console.log('Demo dükkan için örnek parça verileri eklendi.');
}

async function main() {
  await ensureDemoTenant();
  seedDemoParts();
}

main();
