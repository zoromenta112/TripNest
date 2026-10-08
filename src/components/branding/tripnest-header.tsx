import { TripNestLogo } from "./tripnest-logo";
import { TripNestNav } from "./tripnest-nav";
import styles from "./branding.module.css";

type TripNestHeaderProps = {
  title: string;
  subtitle?: string;
};

export function TripNestHeader({ title, subtitle }: TripNestHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.mark}>
          <TripNestLogo size="compact" />
        </div>
        <div className={styles.copy}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </div>
      <TripNestNav />
    </header>
  );
}
