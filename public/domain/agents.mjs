export function normAgentKey(name) {
  return String(name || '').trim().toLowerCase();
}

export function isDuplicateAgent(a, b) {
  const ka = normAgentKey(a.name);
  const kb = normAgentKey(b.name);
  return !!ka && ka === kb;
}

export function agentCompletenessScore(data) {
  let score = 0;
  for (const [, v] of Object.entries(data)) {
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'object') {
      const vals = Object.values(v).filter(Boolean);
      score += 1 + vals.length;
    } else {
      score += 1;
    }
  }
  return score;
}

export function validateAgent({ idSedia, email, name, phone, allUsers, currentUserEmail, bootstrapAdminEmail }) {
  const lama = idSedia ? (allUsers.find(x => x._id === idSedia) || null) : null;
  const emailChanged = !!lama && email !== idSedia;
  let error = null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error = 'E-mel tidak sah.';
  } else if (!name) {
    error = 'Nama penuh wajib diisi.';
  } else if (!phone || phone.length < 10) {
    error = 'No. WhatsApp wajib diisi dengan format yang sah.';
  } else {
    const emailClash = allUsers.find(u => u._id !== idSedia && String(u.email || u._id || '').toLowerCase() === email);
    if (emailClash) {
      error = 'E-mel ini sudah digunakan oleh akaun lain.';
    } else {
      const nameClash = allUsers.find(u => u._id !== idSedia && u.status === 'active' && String(u.name || '').trim().toLowerCase() === name.toLowerCase());
      if (nameClash) {
        error = `Nama "${name}" sudah digunakan agent lain.`;
      } else if (emailChanged && bootstrapAdminEmail && idSedia === String(bootstrapAdminEmail).toLowerCase()) {
        error = 'E-mel Super Admin utama tidak boleh ditukar melalui CRM.';
      } else if (emailChanged && currentUserEmail && idSedia === String(currentUserEmail).toLowerCase()) {
        error = 'E-mel akaun yang sedang digunakan tidak boleh ditukar. Log masuk menggunakan Super Admin lain terlebih dahulu.';
      }
    }
  }
  return { error, lama, emailChanged };
}

export function renameAgentCascade(oldName, newName, { allLeads, stateAssign }) {
  const leadIdsToUpdate = (allLeads || []).filter(l => l.agent === oldName).map(l => l._id);
  const stateAssignValue = (stateAssign || {})[oldName];
  return { leadIdsToUpdate, stateAssignValue };
}
