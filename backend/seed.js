'use strict';

require('dotenv').config();
const { sequelize, User, Resident, Property, GatePass } = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');
    await sequelize.authenticate();
    
    // Ensure tables exist
    await sequelize.sync();

    // 1. Create Admins and Guards
    const passHash = await bcrypt.hash('Password@123', 10);
    
    const [admin, guard1, guard2] = await Promise.all([
      User.findOrCreate({ where: { username: 'admin_test' }, defaults: { email: 'admin@camella.com', password_hash: passHash, role: 'admin' } }),
      User.findOrCreate({ where: { username: 'guard_alpha' }, defaults: { email: 'guard1@camella.com', password_hash: passHash, role: 'guard' } }),
      User.findOrCreate({ where: { username: 'guard_beta' }, defaults: { email: 'guard2@camella.com', password_hash: passHash, role: 'guard' } })
    ]);

    // 2. Create Residents
    const [resUser1, resUser2] = await Promise.all([
      User.findOrCreate({ where: { username: 'juan_dela_cruz' }, defaults: { email: 'juan@camella.com', password_hash: passHash, role: 'resident' } }),
      User.findOrCreate({ where: { username: 'maria_clara' }, defaults: { email: 'maria@camella.com', password_hash: passHash, role: 'resident' } })
    ]);

    const [resident1, resident2] = await Promise.all([
      Resident.findOrCreate({ where: { UserId: resUser1[0].id }, defaults: { full_name: 'Juan Dela Cruz', contact_number: '09171234567' } }),
      Resident.findOrCreate({ where: { UserId: resUser2[0].id }, defaults: { full_name: 'Maria Clara', contact_number: '09181234567' } })
    ]);

    // 3. Create Properties
    const [prop1, prop2, prop3] = await Promise.all([
      Property.findOrCreate({ where: { block: '1', lot: 'A' }, defaults: { ResidentId: resident1[0].id, street: 'Camella Ave' } }),
      Property.findOrCreate({ where: { block: '1', lot: 'B' }, defaults: { ResidentId: resident2[0].id, street: 'Camella Ave' } }),
      Property.findOrCreate({ where: { block: '2', lot: 'C' }, defaults: { ResidentId: resident1[0].id, street: 'Sunset Blvd' } })
    ]);

    // 4. Create sample Gate Passes
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await GatePass.findOrCreate({
      where: { guest_name: 'Lazada Delivery' },
      defaults: {
        PropertyId: prop1[0].id,
        expected_date: today,
        status: 'active',
        pass_id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab'
      }
    });

    await GatePass.findOrCreate({
      where: { guest_name: 'Plumber' },
      defaults: {
        PropertyId: prop2[0].id,
        expected_date: yesterday,
        status: 'used',
        scanned_at: new Date(Date.now() - 80000000), // yesterday
        scanned_by: guard1[0].id,
        pass_id: '12345678-1234-1234-1234-1234567890ab'
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('Test Accounts created:');
    console.log('- admin_test / Password@123');
    console.log('- guard_alpha / Password@123');
    console.log('- juan_dela_cruz / Password@123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

module.exports = { seedDatabase };

// `npm run seed` runs this file directly.
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
