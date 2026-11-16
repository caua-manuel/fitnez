import type { ComponentType } from 'react';
import type { IconProps as PhosphorProps } from '@phosphor-icons/react/dist/lib/types';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { Barbell } from '@phosphor-icons/react/dist/csr/Barbell';
import { BowlFood } from '@phosphor-icons/react/dist/csr/BowlFood';
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar';
import { User } from '@phosphor-icons/react/dist/csr/User';
import { Bell } from '@phosphor-icons/react/dist/csr/Bell';
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Target } from '@phosphor-icons/react/dist/csr/Target';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { ForkKnife } from '@phosphor-icons/react/dist/csr/ForkKnife';
import { Drop } from '@phosphor-icons/react/dist/csr/Drop';
import { BeerStein } from '@phosphor-icons/react/dist/csr/BeerStein';
import { CloudArrowUp } from '@phosphor-icons/react/dist/csr/CloudArrowUp';
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix';
import { Moon } from '@phosphor-icons/react/dist/csr/Moon';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { ClockCounterClockwise } from '@phosphor-icons/react/dist/csr/ClockCounterClockwise';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { DotsThreeVertical } from '@phosphor-icons/react/dist/csr/DotsThreeVertical';
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { Scales } from '@phosphor-icons/react/dist/csr/Scales';
import { Ruler } from '@phosphor-icons/react/dist/csr/Ruler';
import { Circle } from '@phosphor-icons/react/dist/csr/Circle';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { ArrowsLeftRight } from '@phosphor-icons/react/dist/csr/ArrowsLeftRight';
import { CopySimple } from '@phosphor-icons/react/dist/csr/CopySimple';

export type IconName =
 | 'inicio' | 'treino' | 'dieta' | 'evolucao' | 'perfil' | 'sino' | 'editar' | 'relogio' | 'seta' | 'marca'
 | 'calendario' | 'play' | 'plus' | 'alvo' | 'chevron' | 'voltar' | 'busca' | 'fogo' | 'garfo' | 'agua'
 | 'shake' | 'nuvem' | 'engrenagem' | 'lua' | 'sol' | 'info' | 'historico' | 'filtro' | 'mais' | 'salvar' | 'balanca' | 'fita' | 'circulo'
 | 'lixeira' | 'troca' | 'copiar';

/** Aparência Phosphor: duotone (decorativo, padrão), regular/bold (legibilidade em tamanhos pequenos) e fill (item ativo). */
export type IconLook = 'duotone' | 'regular' | 'bold' | 'fill';

const glyphs: Record<IconName, ComponentType<PhosphorProps>> = {
 inicio: House, treino: Barbell, dieta: BowlFood, evolucao: ChartBar, perfil: User, sino: Bell, editar: PencilSimple,
 relogio: Clock, seta: CaretRight, marca: Check, calendario: CalendarBlank, play: Play, plus: Plus, alvo: Target,
 chevron: CaretDown, voltar: ArrowLeft, busca: MagnifyingGlass, fogo: Flame, garfo: ForkKnife, agua: Drop, shake: BeerStein,
 nuvem: CloudArrowUp, engrenagem: GearSix, lua: Moon, sol: Sun, info: Info, historico: ClockCounterClockwise,
 filtro: SlidersHorizontal, mais: DotsThreeVertical, salvar: FloppyDisk, balanca: Scales, fita: Ruler, circulo: Circle,
 lixeira: Trash, troca: ArrowsLeftRight, copiar: CopySimple,
};

/** Setas, marcas e símbolos de uma só linha não ganham nada com duotone: usam regular/bold. */
const LINEAR: ReadonlySet<IconName> = new Set<IconName>(['seta', 'marca', 'plus', 'chevron', 'voltar', 'mais', 'circulo', 'busca']);

function look(name: IconName, weight: number, forced?: IconLook): IconLook {
 if (forced) return forced;
 if (name === 'play') return 'fill';
 if (LINEAR.has(name)) return weight >= 2.2 ? 'bold' : 'regular';
 return weight >= 2.4 ? 'bold' : 'duotone';
}

/** `weight` mantém a escala numérica de traço usada pelas telas: >= 2,4 vira bold; `look` força a aparência. */
export function Icon({ name, size = 24, weight = 1.6, look: forced, className }: { name: IconName; size?: number; weight?: number; look?: IconLook; className?: string }) {
 const Glyph = glyphs[name];
 return <Glyph className={`icon ic-${name}${className ? ` ${className}` : ''}`} size={size} weight={look(name, weight, forced)} aria-hidden="true" focusable="false" />;
}
