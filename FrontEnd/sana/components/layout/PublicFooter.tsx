export default function PublicFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="font-display text-lg font-bold text-white">S</span>
            </div>
            <span className="font-display font-bold text-primary-dark">
              Dejando Huellas
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Acompañamiento psicológico y prevención para niñas, niños y
            adolescentes.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-text">Contacto</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>correo@pendiente.org</li>
            <li>Teléfono pendiente</li>
            <li>Popayán, Cauca</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-text">Enlaces</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li><a href="#about" className="hover:text-primary">Quiénes somos</a></li>
            <li><a href="#programs" className="hover:text-primary">Programas</a></li>
            <li><a href="#news" className="hover:text-primary">Noticias</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-text">Horario de atención</h3>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Horario pendiente de confirmar con la fundación.
          </p>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5 text-center text-xs text-text-subtle">
        © 2026 Fundación Dejando Huellas Felices · Todos los derechos reservados
      </div>
    </footer>
  );
}