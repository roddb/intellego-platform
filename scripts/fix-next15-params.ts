import * as fs from 'fs';
import * as path from 'path';

// Archivos a arreglar
const files = [
  'src/app/api/consudec/activities/[id]/route.ts',
  'src/app/api/consudec/activities/[id]/submission/route.ts',
  'src/app/api/consudec/activities/[id]/submissions/route.ts',
  'src/app/api/consudec/activities/[id]/submit/route.ts',
  'src/app/api/consudec/submissions/[id]/route.ts',
];

const projectRoot = path.join(__dirname, '..');

files.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // Reemplazar el tipo de params
  const before = content;
  content = content.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );

  if (content !== before) {
    modified = true;
    console.log(`✅ Actualizado tipo de params en: ${filePath}`);
  }

  // Reemplazar el acceso a params.id
  const before2 = content;
  content = content.replace(
    /const activityId = params\.id;/g,
    'const { id: activityId } = await params;'
  );
  content = content.replace(
    /const submissionId = params\.id;/g,
    'const { id: submissionId } = await params;'
  );

  if (content !== before2) {
    modified = true;
    console.log(`✅ Actualizado acceso a params en: ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`💾 Guardado: ${filePath}\n`);
  } else {
    console.log(`ℹ️  Sin cambios: ${filePath}\n`);
  }
});

console.log('✨ Script completado!');
