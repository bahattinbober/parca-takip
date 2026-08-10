// Yeni bir dükkan (tenant) eklemek için CLI aracı.
//
// Kullanım (parametreli):
//   node create-tenant.js "Dükkan Adı" kullaniciadi sifre123
//
// Kullanım (interaktif):
//   node create-tenant.js
//   (sırayla dükkan adı, kullanıcı adı ve şifre sorulur)

const fs = require('fs');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const {
  readTenants,
  writeTenants,
  findTenantByUsername,
  getTenantDir,
  getTenantPartsFile,
} = require('./lib/tenants');

function slugify(text) {
  return text
    .replace(/İ/g, 'I')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function uniqueTenantId(baseSlug, tenants) {
  const existingIds = new Set(tenants.map((t) => t.id));
  let id = baseSlug || 'dukkan';
  let suffix = 1;
  while (existingIds.has(id)) {
    suffix += 1;
    id = `${baseSlug || 'dukkan'}-${suffix}`;
  }
  return id;
}

async function main() {
  const [, , argDukkanAdi, argKullaniciAdi, argSifre] = process.argv;

  let dukkanAdi = argDukkanAdi;
  let kullaniciAdi = argKullaniciAdi;
  let sifre = argSifre;

  if (!dukkanAdi || !kullaniciAdi || !sifre) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!dukkanAdi) dukkanAdi = await ask(rl, 'Dükkan adı: ');
    if (!kullaniciAdi) kullaniciAdi = await ask(rl, 'Kullanıcı adı: ');
    if (!sifre) sifre = await ask(rl, 'Şifre: ');
    rl.close();
  }

  dukkanAdi = (dukkanAdi || '').trim();
  kullaniciAdi = (kullaniciAdi || '').trim();
  sifre = (sifre || '').trim();

  if (!dukkanAdi || !kullaniciAdi || !sifre) {
    console.error('Dükkan adı, kullanıcı adı ve şifre boş olamaz.');
    process.exit(1);
  }

  if (sifre.length < 6) {
    console.error('Şifre en az 6 karakter olmalı.');
    process.exit(1);
  }

  if (findTenantByUsername(kullaniciAdi)) {
    console.error(`"${kullaniciAdi}" kullanıcı adı zaten kullanılıyor.`);
    process.exit(1);
  }

  const tenants = readTenants();
  const tenantId = uniqueTenantId(slugify(dukkanAdi), tenants);
  const sifreHash = await bcrypt.hash(sifre, 10);

  tenants.push({
    id: tenantId,
    dukkanAdi,
    kullaniciAdi,
    sifreHash,
    olusturmaTarihi: new Date().toISOString(),
  });
  writeTenants(tenants);

  fs.mkdirSync(getTenantDir(tenantId), { recursive: true });
  const partsFile = getTenantPartsFile(tenantId);
  if (!fs.existsSync(partsFile)) {
    fs.writeFileSync(partsFile, '[]\n', 'utf-8');
  }

  console.log('\n✅ Yeni dükkan oluşturuldu.\n');
  console.log(`  Dükkan adı    : ${dukkanAdi}`);
  console.log(`  Tenant ID     : ${tenantId}`);
  console.log(`  Kullanıcı adı : ${kullaniciAdi}`);
  console.log(`  Veri dosyası  : data/tenants/${tenantId}/parts.json`);
  console.log('\nBu kullanıcı adı ve şifre ile login.html sayfasından giriş yapılabilir.');
}

main().catch((err) => {
  console.error('Beklenmeyen bir hata oluştu:', err);
  process.exit(1);
});
