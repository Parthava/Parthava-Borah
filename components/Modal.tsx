"use client";

import { useEffect, useRef } from "react";
import { profile, type Section } from "@/data/resume";

export default function Modal({
  section,
  index,
  total,
  first,
  onClose,
}: {
  section: Section;
  index: number;
  total: number;
  first: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={section.title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-inner">
          <div className="modal-head">
            <div>
              <div className="stage-no">
                STAGE {index + 1}/{total}
                {first && <span className="bonus"> +1000</span>}
              </div>
              <h2>{section.title}</h2>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              X
            </button>
          </div>

          <div className="modal-body">
            {section.items.map((item, i) => (
              <article className="card" key={i}>
                <div className="row">
                  <h3>{item.title}</h3>
                  {item.period && <span className="period">{item.period}</span>}
                </div>
                {item.subtitle && <div className="sub">{item.subtitle}</div>}
                {item.description && <p>{item.description}</p>}
                {item.bullets && (
                  <ul>
                    {item.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
                {item.tags && (
                  <div className="tags">
                    {item.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {item.link && (
                  <a
                    className="pixel-link"
                    href={item.link.href}
                    target={item.link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                  >
                    {item.link.label}
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="modal-foot">
            <span>ESC = CLIMB OUT OF THE PIPE</span>
            {profile.resumeUrl && (
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                DOWNLOAD RESUME
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
