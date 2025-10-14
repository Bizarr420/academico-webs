import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getAllCourses } from '@/app/services/courses';
import { getAllSubjects } from '@/app/services/subjects';
import { getAllPeriods } from '@/app/services/periods';
import { getTeachers } from '@/app/services/teachers';
import type {
  Course,
  CourseParallel,
  Period,
  Subject,
  Teacher,
} from '@/app/types';

export type BaseFilterValues = {
  periodo_id?: number | null;
  curso_id?: number | null;
  paralelo_id?: number | null;
  materia_id?: number | null;
  docente_id?: number | null;
  search?: string;
};

type BaseAcademicFiltersProps = {
  values: BaseFilterValues;
  onChange: (values: Partial<BaseFilterValues>) => void;
  showTeacher?: boolean;
  showSearch?: boolean;
  disabled?: boolean;
  className?: string;
};

const toNumberOrNull = (value: string) => {
  if (!value || value === 'null' || value === 'undefined') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const usePeriods = () => {
  const { data } = useQuery({
    queryKey: ['periods', 'all'],
    queryFn: () => getAllPeriods(),
  });

  return data ?? [];
};

const useCourses = () => {
  const { data } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => getAllCourses(),
  });

  return data ?? [];
};

const useSubjects = () => {
  const { data } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: () => getAllSubjects(),
  });

  return data ?? [];
};

const useTeachers = (enabled: boolean) => {
  const { data } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: () => getTeachers({ page: 1, page_size: 200, estado: 'ACTIVO' }),
    enabled,
  });

  return data?.items ?? [];
};

export default function BaseAcademicFilters({
  values,
  onChange,
  showTeacher = false,
  showSearch = true,
  disabled = false,
  className = '',
}: BaseAcademicFiltersProps) {
  const periods = usePeriods();
  const courses = useCourses();
  const subjects = useSubjects();
  const teachers = useTeachers(showTeacher);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === values.curso_id) ?? null,
    [courses, values.curso_id],
  );

  const availableParallels: CourseParallel[] = selectedCourse?.paralelos ?? [];

  const availableSubjects = useMemo(() => {
    if (!values.curso_id) {
      return subjects;
    }

    return subjects.filter((subject) => subject.curso_id === values.curso_id);
  }, [subjects, values.curso_id]);

  useEffect(() => {
    if (!selectedCourse) {
      if (values.paralelo_id) {
        onChange({ paralelo_id: null });
      }
    } else if (values.paralelo_id) {
      const exists = availableParallels.some((parallel) => parallel.id === values.paralelo_id);
      if (!exists) {
        onChange({ paralelo_id: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.id]);

  useEffect(() => {
    if (!values.materia_id) {
      return;
    }

    const exists = availableSubjects.some((subject) => subject.id === values.materia_id);
    if (!exists) {
      onChange({ materia_id: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.curso_id, availableSubjects.length]);

  const handleSelectChange = (key: keyof BaseFilterValues) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value;
    const parsed = toNumberOrNull(raw);

    if (key === 'curso_id') {
      onChange({ curso_id: parsed, paralelo_id: null, materia_id: null });
      return;
    }

    onChange({ [key]: parsed });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value });
  };

  const renderOption = (items: { id: number; nombre: string }[], placeholder: string) => [
    <option key="placeholder" value="">
      {placeholder}
    </option>,
    ...items.map((item) => (
      <option key={item.id} value={item.id}>
        {item.nombre}
      </option>
    )),
  ];

  const renderCourses = (list: Course[]) => [
    <option key="placeholder" value="">
      Selecciona un curso
    </option>,
    ...list.map((course) => (
      <option key={course.id} value={course.id}>
        {course.nombre}
        {course.etiqueta ? ` — ${course.etiqueta}` : ''}
      </option>
    )),
  ];

  const renderParallels = (list: CourseParallel[]) => [
    <option key="placeholder" value="">
      Todos los paralelos
    </option>,
    ...list.map((parallel) => (
      <option key={parallel.id} value={parallel.id}>
        {parallel.nombre || parallel.etiqueta || `Paralelo ${parallel.id}`}
      </option>
    )),
  ];

  const renderSubjects = (list: Subject[]) => [
    <option key="placeholder" value="">
      Todas las materias
    </option>,
    ...list.map((subject) => (
      <option key={subject.id} value={subject.id}>
        {subject.nombre}
        {subject.curso ? ` — ${subject.curso}` : ''}
      </option>
    )),
  ];

  const renderTeachers = (list: Teacher[]) => [
    <option key="placeholder" value="">
      Todos los docentes
    </option>,
    ...list.map((teacher) => (
      <option key={teacher.id} value={teacher.id}>
        {teacher.persona?.nombres} {teacher.persona?.apellidos}
      </option>
    )),
  ];

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="filters-periodo">
          Periodo
        </label>
        <select
          id="filters-periodo"
          className="border rounded px-3 py-2"
          value={values.periodo_id ?? ''}
          onChange={handleSelectChange('periodo_id')}
          disabled={disabled}
        >
          {renderOption(periods as Period[], 'Selecciona un periodo')}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="filters-curso">
          Curso
        </label>
        <select
          id="filters-curso"
          className="border rounded px-3 py-2"
          value={values.curso_id ?? ''}
          onChange={handleSelectChange('curso_id')}
          disabled={disabled}
        >
          {renderCourses(courses)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="filters-paralelo">
          Paralelo
        </label>
        <select
          id="filters-paralelo"
          className="border rounded px-3 py-2"
          value={values.paralelo_id ?? ''}
          onChange={handleSelectChange('paralelo_id')}
          disabled={disabled || availableParallels.length === 0}
        >
          {renderParallels(availableParallels)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="filters-materia">
          Materia
        </label>
        <select
          id="filters-materia"
          className="border rounded px-3 py-2"
          value={values.materia_id ?? ''}
          onChange={handleSelectChange('materia_id')}
          disabled={disabled || availableSubjects.length === 0}
        >
          {renderSubjects(availableSubjects)}
        </select>
      </div>

      {showTeacher && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600" htmlFor="filters-docente">
            Docente
          </label>
          <select
            id="filters-docente"
            className="border rounded px-3 py-2"
            value={values.docente_id ?? ''}
            onChange={handleSelectChange('docente_id')}
            disabled={disabled || teachers.length === 0}
          >
            {renderTeachers(teachers)}
          </select>
        </div>
      )}

      {showSearch && (
        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-600" htmlFor="filters-search">
            Búsqueda
          </label>
          <input
            id="filters-search"
            type="search"
            className="border rounded px-3 py-2"
            placeholder="Buscar por estudiante, materia o docente"
            value={values.search ?? ''}
            onChange={handleSearchChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

