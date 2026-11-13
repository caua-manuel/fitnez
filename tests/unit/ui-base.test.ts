import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Menu } from '../../src/ui/Menu';
import { Select } from '../../src/ui/Select';
import { ToastHost, dismissToast } from '../../src/ui/UndoToast';

describe('estrutura e aria dos componentes compartilhados', () => {
  it('Menu fechado: botão com haspopup=menu e aria-expanded=false, sem menu no DOM', () => {
    const html = renderToStaticMarkup(h(Menu, { label: "Mais ações", trigger: "⋮", items: [{ label: "Editar" }] }));
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Mais ações"');
    expect(html).not.toContain('role="menu"');
  });
  it('Select fechado: botão com haspopup=listbox e nome com o valor atual', () => {
    const html = renderToStaticMarkup(h(Select<number>, { label: "Período", value: 8, options: [{ value: 4, label: "4 semanas" }, { value: 8, label: "8 semanas" }], onChange: () => {} }));
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-label="Período: 8 semanas"');
    expect(html).not.toContain('role="listbox"');
  });
  it('ToastHost: região role=status sempre montada; sem aviso fica vazia', () => {
    dismissToast();
    const html = renderToStaticMarkup(h(ToastHost));
    expect(html).toContain('role="status"');
    expect(html).not.toContain('Desfazer');
  });
  // O comportamento com aviso (SSR usa o snapshot vazio) fica para o e2e quando as features adotarem o ToastHost.
});
