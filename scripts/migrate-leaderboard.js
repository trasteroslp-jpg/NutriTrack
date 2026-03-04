/**
 * Script de migración: Copia name y xp de todos los usuarios
 * desde la colección "users" a "leaderboard_profiles".
 * 
 * Ejecutar una sola vez: node scripts/migrate-leaderboard.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyB-a_ksawsMnTQ1myC83B8V0erCK-dfehg",
    authDomain: "nutritrack-327c1.firebaseapp.com",
    projectId: "nutritrack-327c1",
    storageBucket: "nutritrack-327c1.firebasestorage.app",
    messagingSenderId: "527331333577",
    appId: "1:527331333577:web:0efb5bd83bfc34124c4418",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    console.log('🔄 Iniciando migración de perfiles públicos...\n');

    const usersSnap = await getDocs(collection(db, 'users'));
    let count = 0;
    let errors = 0;

    for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;

        try {
            await setDoc(doc(db, 'leaderboard_profiles', uid), {
                name: data.name || 'Héroe NutriTrack',
                xp: data.xp || 0,
                profileImage: data.profileImage || null,
            });
            count++;
            console.log(`  ✅ ${data.name || uid} → ${data.xp || 0} XP`);
        } catch (e) {
            errors++;
            console.error(`  ❌ Error migrando ${uid}:`, e.message);
        }
    }

    console.log(`\n📊 Migración completada: ${count} usuarios migrados, ${errors} errores.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
