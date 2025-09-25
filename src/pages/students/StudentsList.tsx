import { useQuery } from '@tanstack/react-query';
return (
<div className="bg-white rounded-2xl shadow p-4">
<div className="flex items-center justify-between mb-4">
<h1 className="text-lg font-semibold">Estudiantes</h1>
<Link to="/estudiantes/nuevo" className="px-3 py-2 rounded bg-gray-900 text-white">Nuevo</Link>
</div>


<div className="mb-3">
<input
placeholder="Buscar por nombre o CI…"
className="border rounded px-3 py-2 w-full"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>
</div>


{isLoading && <p>Cargando…</p>}
{isError && <p className="text-red-600">Error al cargar.</p>}


{data && (
<>
<table className="w-full text-sm">
<thead>
<tr className="text-left border-b">
<th className="py-2">CI</th>
<th>Nombre</th>
<th>Curso</th>
</tr>
</thead>
<tbody>
{data.items.map((s) => (
<tr key={s.id} className="border-b last:border-0">
<td className="py-2">{s.ci || '-'}</td>
<td>{s.apellidos} {s.nombres}</td>
<td>{s.curso || '-'}</td>
</tr>
))}
</tbody>
</table>


<div className="flex items-center gap-2 justify-end mt-4">
<button
className="px-3 py-1 border rounded"
onClick={() => setPage((p) => Math.max(1, p - 1))}
disabled={page === 1}
>Anterior</button>
<span>Página {page}</span>
<button
className="px-3 py-1 border rounded"
onClick={() => setPage((p) => p + 1)}
disabled={data.items.length < 10}
>Siguiente</button>
</div>
</>
)}
</div>
);
}