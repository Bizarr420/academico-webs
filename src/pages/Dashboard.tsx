export default function Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-2">Resumen</h2>
        <p className="text-sm text-gray-600">
          Aquí irán métricas (estudiantes, docentes, cursos, alertas ML, etc.).
        </p>
      </div>
      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-2">Últimas actualizaciones</h2>
        <ul className="list-disc pl-5 text-sm text-gray-600">
          <li>Calificaciones cargadas recientemente</li>
          <li>Asistencias de la semana</li>
        </ul>
      </div>
    </div>
  );
}
