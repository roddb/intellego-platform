import { createUser, generateStudentId } from '../src/lib/db-operations';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Define new CONSUDEC students
const newStudents = [
  {
    name: 'Agustina Laura Cecere',
    email: 'agustinalauracecere@gmail.com',
  },
  {
    name: 'Sofía Cuoco',
    email: 'soficuoco@gmail.com',
  },
  {
    name: 'Rodrigo Gaston Di Bernardo',
    email: 'rodrigodibernardo@hotmail.com',
  },
  {
    name: 'Emilse Paola Lencina',
    email: 'emmilencina@gmail.com',
  },
  {
    name: 'Benjamin Rengifo',
    email: 'Rengifobenjamin@gmail.com',
  },
];

// Generic temporary password for all new students
const TEMPORARY_PASSWORD = 'Intellego2025!';

async function createConsudecStudents() {
  console.log('🚀 Starting CONSUDEC student creation...\n');

  const createdUsers: Array<{
    name: string;
    email: string;
    studentId: string;
    password: string;
  }> = [];

  try {
    for (const student of newStudents) {
      console.log(`Creating user: ${student.name}...`);

      // Generate student ID
      const studentId = await generateStudentId();

      // Create user with CONSUDEC configuration
      const user = await createUser({
        name: student.name,
        email: student.email,
        password: TEMPORARY_PASSWORD,
        role: 'STUDENT',
        studentId: studentId,
        sede: 'CONSUDEC',
        academicYear: '4to Año',
        division: 'Única',
        subjects: '', // Empty for CONSUDEC students
      });

      if (user) {
        console.log(`✅ Created: ${student.name} (${studentId})`);
        createdUsers.push({
          name: student.name,
          email: student.email,
          studentId: studentId,
          password: TEMPORARY_PASSWORD,
        });
      } else {
        console.error(`❌ Failed to create: ${student.name}`);
      }
    }

    // Verify all users were created
    console.log('\n📊 Verification: Querying all CONSUDEC students...');
    const result = await client.execute({
      sql: 'SELECT name, email, studentId, sede, academicYear FROM User WHERE sede = ? ORDER BY studentId',
      args: ['CONSUDEC'],
    });

    console.log(`\n✅ Total CONSUDEC students in database: ${result.rows.length}`);
    console.log('\nAll CONSUDEC students:');
    console.table(result.rows);

    // Print credentials for new users
    console.log('\n🔑 CREDENTIALS FOR NEW STUDENTS:\n');
    console.log('═'.repeat(80));
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Student ID: ${user.studentId}`);
      console.log(`   Temporary Password: ${user.password}`);
      console.log('─'.repeat(80));
    });

    console.log('\n📧 Please share these credentials with the students.');
    console.log('⚠️  Ask them to change their password after first login.\n');

  } catch (error) {
    console.error('❌ Error creating CONSUDEC students:', error);
    process.exit(1);
  }
}

createConsudecStudents();
