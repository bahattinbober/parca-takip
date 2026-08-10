const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const TENANTS_DIR = path.join(DATA_DIR, 'tenants');

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function readTenants() {
  return readJson(TENANTS_FILE);
}

function writeTenants(tenants) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  writeJson(TENANTS_FILE, tenants);
}

function findTenantByUsername(kullaniciAdi) {
  if (!kullaniciAdi) return undefined;
  const tenants = readTenants();
  return tenants.find(
    (t) => t.kullaniciAdi.toLowerCase() === kullaniciAdi.toLowerCase()
  );
}

function findTenantById(tenantId) {
  const tenants = readTenants();
  return tenants.find((t) => t.id === tenantId);
}

function getTenantDir(tenantId) {
  return path.join(TENANTS_DIR, tenantId);
}

function getTenantPartsFile(tenantId) {
  return path.join(getTenantDir(tenantId), 'parts.json');
}

module.exports = {
  DATA_DIR,
  TENANTS_FILE,
  TENANTS_DIR,
  readJson,
  writeJson,
  readTenants,
  writeTenants,
  findTenantByUsername,
  findTenantById,
  getTenantDir,
  getTenantPartsFile,
};
