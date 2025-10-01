import type { Student } from '@/app/types';
import {
  SEX_LABELS,
  STUDENT_SITUATION_LABELS,
  STUDENT_STATUS_LABELS,
} from '@/app/types';

export interface StudentSummaryProps {
  student: Student;
  className?: string;
}

const formatEnumValue = (value: string | null | undefined, labels: Record<string, string>) => {
  if (!value) {
    return 'Por defecto';
  }

  return labels[value] ?? value;
};

const joinClassNames = (...classNames: (string | false | null | undefined)[]) =>
  classNames.filter(Boolean).join(' ');

export function StudentSummary({ student, className }: StudentSummaryProps) {
  const persona = student.persona;
  const fullName = persona
    ? [persona.apellidos, persona.nombres]
        .map((part) => part?.trim?.() ?? '')
        .filter((part) => part.length > 0)
        .join(' ')
    : '';

  const sexoLabel = persona?.sexo ? SEX_LABELS[persona.sexo] : 'No especificado';
  const personaName = fullName || (persona ? `Persona ${student.persona_id}` : 'Sin información');

  const containerClassName = joinClassNames(
    'rounded-xl border border-gray-200 bg-white p-4',
    className,
  );

  return (
    <div className={containerClassName}>
      <div className="grid gap-4 md:grid-cols-2">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código</dt>
            <dd className="text-base font-semibold text-gray-900">{student.codigo_est}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Año de ingreso</dt>
            <dd className="text-sm text-gray-900">{student.anio_ingreso ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Situación</dt>
            <dd className="text-sm text-gray-900">
              {formatEnumValue(student.situacion, STUDENT_SITUATION_LABELS)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</dt>
            <dd className="text-sm text-gray-900">
              {formatEnumValue(student.estado, STUDENT_STATUS_LABELS)}
            </dd>
          </div>
        </dl>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Persona</dt>
            <dd className="text-sm text-gray-900">
              <p className="font-semibold text-gray-900">{personaName}</p>
              <p className="text-xs text-gray-500">ID persona: {student.persona_id}</p>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sexo</dt>
            <dd className="text-sm text-gray-900">{sexoLabel}</dd>
          </div>
          {persona?.fecha_nacimiento && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha de nacimiento
              </dt>
              <dd className="text-sm text-gray-900">{persona.fecha_nacimiento}</dd>
            </div>
          )}
          {persona?.celular && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Celular</dt>
              <dd className="text-sm text-gray-900">{persona.celular}</dd>
            </div>
          )}
          {persona?.correo && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Correo</dt>
              <dd className="text-sm text-gray-900">{persona.correo}</dd>
            </div>
          )}
          {!persona && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Detalles</dt>
              <dd className="text-sm text-gray-900">Información de persona no disponible.</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

export default StudentSummary;
