import { motion } from "framer-motion";

// Dados dos links com imagens hospedadas externamente
const LINKS_DATA = [
  {
    id: "whatsapp",
    href: "https://wa.me/5571999597054?text=Ol%C3%A1%2C%20vim%20do%20Instagram%20e%20gostaria%20de%20agendar%20meu%20atendimento",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/17.png",
    alt: "Agende uma consulta via WhatsApp",
  },
  {
    id: "maps-acm",
    href: "https://www.google.com.br/maps/dir//Fitclean+Est%C3%A9tica+-+ACM+-+Av.+Ant%C3%B4nio+Carlos+Magalh%C3%A3es,+3244+-+Caminho+das+%C3%81rvores,+Salvador+-+BA,+41800-700/@-12.9877584,-38.5368911,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x7161b8bd699b2a1:0x16daf0faaf29003b!2m2!1d-38.4668533!2d-12.9877584?entry=ttu&g_ep=EgoyMDI1MDkyNC4wIKXMDSoASAFQAw%3D%3D",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/18.png",
    alt: "Onde estamos - Av. ACM",
  },
  {
    id: "reviews-acm",
    href: "https://www.google.com/search?q=fitclean+acm&oq=fitclean+acm+&gs_lcrp=EgZjaHJvbWUyCggAEEUYFhgeGDkyCggBEAAYgAQYogQyCggCEAAYogQYiQUyBwgDEAAY7wUyBwgEEAAY7wUyBggFEEUYPDIGCAYQRRg8MgYIBxBFGDzSAQgyNjE2ajBqNKgCALACAQ&sourceid=chrome&ie=UTF-8#lrd=0x7161b8bd699b2a1:0x16daf0faaf29003b,3,,,,",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/19.png",
    alt: "Avalie nosso perfil - Av. ACM",
  },
  {
    id: "maps-norte",
    href: "https://www.google.com.br/maps/place/Fitclean+Est%C3%A9tica+Salvador+Norte+Shopping/@-12.9877584,-38.5368911,12z/data=!3m1!5s0x7161651735e4ec5:0x9f754abd23b45fa6!4m10!1m2!2m1!1sfitclean+estetica!3m6!1s0x71617160577a5d3:0xdee7e8af37bd17c9!8m2!3d-12.9087798!4d-38.3510467!15sChFmaXRjbGVhbiBlc3RldGljYVoTIhFmaXRjbGVhbiBlc3RldGljYZIBFmhlYWx0aF9hbmRfYmVhdXR5X3Nob3CqAUkKDS9nLzExaGR3Mmtwc3YQATIfEAEiG5O26U-iz-w0lBiLm3QwpxJcBMMEDMYNXkQlizIVEAIiEWZpdGNsZWFuIGVzdGV0aWNh4AEA!16s%2Fg%2F11rxxzk7m0?entry=ttu&g_ep=EgoyMDI1MDkyNC4wIKXMDSoASAFQAw%3D%3D",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/20.png",
    alt: "Onde estamos - Salvador Norte Shopping",
  },
  {
    id: "reviews-norte",
    href: "https://www.google.com/search?sca_esv=6a46622504ef503e&sxsrf=AE3TifNlt3yAm5GzWgvKbofHs4wOobGdlg:1759244833756&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E1dxa0bQqnEzymQdmPkYp3rcoBYhkJ4d1AtAPuM3KPJeQ9VCzXzaMVm_HdTb3CTQODsixbTtcHHpAFKfUzVqbO3XRwpcy4Y5he2Q_gYN7BZe-asWNdzwfsYK-qY_AqoJRps0UuQ%3D&q=Fitclean+Est%C3%A9tica+Salvador+Norte+Shopping+Coment%C3%A1rios&sa=X&ved=2ahUKEwjeh47b4YCQAxXArpUCHRxYNL4Q0bkNegQIIRAE&biw=1172&bih=820&dpr=1#lrd=0x71617160577a5d3:0xdee7e8af37bd17c9,3,,,,",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/21.png",
    alt: "Avalie nosso perfil - Salvador Norte Shopping",
  },
  {
    id: "website",
    href: "https://fitcleanestetica.com.br/",
    image: "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/22.png",
    alt: "Visite nosso site",
  },
];

const LOGO_URL =
  "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/imgi_16_logo_interna-1.png";

const FOOTER_LOGO_URL =
  "https://mediumseagreen-parrot-285355.hostingersite.com/wp-content/uploads/2025/10/MDS-LOGO01-1-1024x316.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const LinksPage = () => (
  <div className="links-page">
    <style>{`
      .links-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(
          180deg,
          hsl(230, 30%, 94%) 0%,
          hsl(240, 25%, 90%) 50%,
          hsl(230, 30%, 94%) 100%
        );
        font-family: 'Quicksand', 'Roboto', sans-serif;
      }

      .links-page__header {
        display: flex;
        justify-content: center;
        padding: 2.5rem 1rem 1rem;
      }

      .links-page__logo {
        width: clamp(140px, 30vw, 220px);
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
      }

      .links-page__grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 1rem 1rem 2.5rem;
        width: 100%;
        max-width: 600px;
      }

      .links-page__card {
        display: block;
        width: 100%;
        border-radius: 16px;
        overflow: hidden;
        box-shadow:
          0 4px 24px rgba(100, 40, 120, 0.12),
          0 1.5px 6px rgba(0, 0, 0, 0.06);
        transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
        cursor: pointer;
        text-decoration: none;
      }

      .links-page__card:hover {
        transform: scale(0.97);
        box-shadow:
          0 6px 32px rgba(100, 40, 120, 0.18),
          0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .links-page__card:active {
        transform: scale(0.95);
      }

      .links-page__card-img {
        width: 100%;
        height: auto;
        display: block;
        transition: filter 0.3s ease-out;
      }

      .links-page__card:hover .links-page__card-img {
        filter: brightness(1.04);
      }

      .links-page__footer {
        width: 100%;
        background: hsl(0, 0%, 5%);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1rem 1.5rem;
        gap: 0.75rem;
        margin-top: auto;
      }

      .links-page__footer-logo {
        width: clamp(120px, 28vw, 200px);
        height: auto;
        object-fit: contain;
        opacity: 0.85;
      }

      .links-page__copyright {
        color: hsl(0, 0%, 60%);
        font-size: 0.8rem;
        letter-spacing: 0.3px;
        text-align: center;
      }
    `}</style>

    {/* Header com logo */}
    <header className="links-page__header">
      <motion.img
        src={LOGO_URL}
        alt="FitClean Estética"
        className="links-page__logo"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </header>

    {/* Cards de links */}
    <motion.nav
      className="links-page__grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label="Links úteis Fitclean"
    >
      {LINKS_DATA.map((link) => (
        <motion.a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="links-page__card"
          variants={itemVariants}
        >
          <img
            src={link.image}
            alt={link.alt}
            className="links-page__card-img"
            loading="lazy"
            decoding="async"
            width={1024}
            height={536}
          />
        </motion.a>
      ))}
    </motion.nav>

    {/* Footer */}
    <footer className="links-page__footer">
      <img
        src={FOOTER_LOGO_URL}
        alt="MDS Medical Digital Service"
        className="links-page__footer-logo"
        loading="lazy"
        decoding="async"
      />
      <p className="links-page__copyright">
        Fitclean Estetica © 2024 - Todos os Direitos Reservados.
      </p>
    </footer>
  </div>
);

export default LinksPage;
