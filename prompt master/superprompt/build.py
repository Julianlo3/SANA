"""
Ensambla superprompt/secciones/*.md en SUPERPROMPT.md (raíz del repositorio).

Uso:
    python superprompt/build.py           valida y genera
    python superprompt/build.py --check   solo valida (usado en Pull Requests)

Validaciones (error = código de salida 1):
    - Cada sección inicia con <!-- responsable: ... | estado: ... -->
    - Cada HU de la sección 07 tiene al menos un Escenario con Dado, Cuando y Entonces
    - No hay identificadores de HU duplicados
Reporte informativo:
    - Número de marcadores [PENDIENTE: ...] y [CONFIRMAR: ...] por sección

Requiere Python 3.9+ sin dependencias externas.
"""
from pathlib import Path
import re
import sys

DIR = Path(__file__).resolve().parent
SECCIONES = DIR / "secciones"
SALIDA = DIR.parent / "SUPERPROMPT.md"

METADATOS = re.compile(r"^<!--\s*responsable:.*\|\s*estado:.*-->\s*\n", re.M)


def validar(archivos):
    errores, reporte = [], []
    for f in archivos:
        texto = f.read_text(encoding="utf-8")
        if not METADATOS.match(texto):
            errores.append(f"{f.name}: falta la línea de metadatos <!-- responsable: ... | estado: ... -->")
        pend = texto.count("[PENDIENTE")
        conf = texto.count("[CONFIRMAR")
        estado = re.search(r"estado:\s*([^-]+?)\s*-->", texto)
        reporte.append((f.name, estado.group(1) if estado else "?", pend, conf))

    hu_file = SECCIONES / "07-historias-usuario.md"
    if hu_file.exists():
        partes = re.split(r"^### (HU-\d+\.\d+)\s*$", hu_file.read_text(encoding="utf-8"), flags=re.M)
        ids = partes[1::2]
        for hu, cuerpo in zip(partes[1::2], partes[2::2]):
            escenarios = re.split(r"^\s*Escenario:", cuerpo, flags=re.M)[1:]
            if not escenarios:
                errores.append(f"{hu}: sin escenarios de aceptación")
            for i, esc in enumerate(escenarios, 1):
                for paso in ("Dado", "Cuando", "Entonces"):
                    if not re.search(rf"^\s*{paso}\s+\S", esc, flags=re.M):
                        errores.append(f"{hu} escenario {i}: falta el paso '{paso}'")
        duplicados = sorted({i for i in ids if ids.count(i) > 1})
        if duplicados:
            errores.append(f"HU duplicadas: {', '.join(duplicados)}")
        print(f"Historias de usuario: {len(ids)}")

    print(f"{'Sección':<34}{'Estado':<12}{'PENDIENTE':>10}{'CONFIRMAR':>11}")
    for nombre, estado, p, c in reporte:
        print(f"{nombre:<34}{estado:<12}{p:>10}{c:>11}")
    print(f"{'Total':<46}{sum(r[2] for r in reporte):>10}{sum(r[3] for r in reporte):>11}")
    return errores


def ensamblar(archivos):
    cuerpos, indice = [], []
    for f in archivos:
        texto = METADATOS.sub("", f.read_text(encoding="utf-8"), count=1).strip()
        titulo = next((l[2:].strip() for l in texto.splitlines() if l.startswith("# ")), f.stem)
        ancla = re.sub(r"[^\w\s-]", "", titulo.lower()).strip().replace(" ", "-")
        indice.append(f"- [{titulo}](#{ancla})")
        cuerpos.append(texto)

    cabecera = "\n".join([
        "# SUPERPROMPT - SANA",
        "",
        "Especificación completa del sistema SANA (Fundación Dejando Huellas Felices).",
        "Archivo generado por `superprompt/build.py` a partir de `superprompt/secciones/`. No editar directamente.",
        "",
        "## Contenido",
        "",
        *indice,
    ])
    SALIDA.write_text(cabecera + "\n\n---\n\n" + "\n\n---\n\n".join(cuerpos) + "\n", encoding="utf-8")
    lineas = SALIDA.read_text(encoding="utf-8").count("\n")
    print(f"Generado {SALIDA.name}: {len(archivos)} secciones, {lineas} líneas")


def main():
    archivos = sorted(SECCIONES.glob("[0-9][0-9]-*.md"))
    if not archivos:
        sys.exit("No se encontraron secciones en superprompt/secciones/")
    errores = validar(archivos)
    for e in errores:
        print(f"ERROR {e}")
    if errores:
        sys.exit(1)
    if "--check" not in sys.argv:
        ensamblar(archivos)


if __name__ == "__main__":
    main()
