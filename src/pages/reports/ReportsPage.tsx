import StudentReportSection from '@/pages/reports/StudentReportSection';
import CourseReportSection from '@/pages/reports/CourseReportSection';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold">Reportes académicos</h1>
        <p className="text-sm text-gray-500">
          Visualiza indicadores clave y descarga reportes para estudiantes y cursos.
        </p>
      </header>

      <StudentReportSection />
      <CourseReportSection />
    </div>
  );
}

