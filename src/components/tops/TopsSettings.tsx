import { Check, Layout, Palette, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs } from '../ui/tabs'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { useTranslation } from 'react-i18next'

interface TopsSettingsProps {
  mode: 'tier' | 'top10';
  setMode: (mode: 'tier' | 'top10') => void;
  showWatermark: boolean;
  setShowWatermark: (val: boolean) => void;
  customWatermark: string;
  setCustomWatermark: (val: string) => void;
  selectedBg: string;
  setSelectedBg: (val: string) => void;
  aspectRatio: 'standard' | 'square' | 'story' | 'landscape';
  setAspectRatio: (val: 'standard' | 'square' | 'story' | 'landscape') => void;
}

const BG_THEMES = [
  { id: 'default', class: 'from-[#141b29] via-[#0e121b] to-[#0a362e]', name: 'Jade' },
  { id: 'sunset', class: 'from-indigo-950 via-purple-950 to-pink-900', name: 'Atardecer' },
  { id: 'cyberpunk', class: 'from-slate-950 via-violet-950 to-indigo-900', name: 'Cyberpunk' },
  { id: 'ocean', class: 'from-slate-950 via-sky-950 to-cyan-900', name: 'Océano' },
  { id: 'volcanic', class: 'from-stone-950 via-stone-900 to-red-950', name: 'Volcánico' },
  { id: 'midnight-gold', class: 'from-zinc-950 via-zinc-900 to-amber-950', name: 'Oro' },
  { id: 'minimal', class: 'from-zinc-950 via-zinc-900 to-zinc-950', name: 'Carbono' }
]

export function TopsSettings({
  mode,
  setMode,
  showWatermark,
  setShowWatermark,
  customWatermark,
  setCustomWatermark,
  selectedBg,
  setSelectedBg,
  aspectRatio,
  setAspectRatio,
}: TopsSettingsProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-border/40 shadow-lg bg-card/70 backdrop-blur-xl">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Row 1: Mode Switch & Aspect Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
          <div>
            <Tabs
              options={[
                { id: 'tier', label: 'Tier List' },
                { id: 'top10', label: 'Top 10' }
              ]}
              activeTab={mode}
              onChange={setMode}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0">
              <Layout className="w-3 h-3 text-primary" />
              <span className="hidden sm:inline">{t('topsSettings.aspectRatioLabel', 'Formato')}:</span>
            </span>
            <div className="flex-1">
              <Tabs
                options={[
                  { id: 'standard', label: t('topsSettings.fluid', 'Fluido') },
                  { id: 'square', label: '1:1' },
                  { id: 'story', label: '9:16' },
                  { id: 'landscape', label: '16:9' }
                ]}
                activeTab={aspectRatio}
                onChange={setAspectRatio}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Theme Swatches & Watermark */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/20 pt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Palette className="w-3 h-3 text-primary" /> {t('topsSettings.theme', 'Tema')}:
            </span>
            <div className="flex items-center gap-1.5">
              {BG_THEMES.map((bg) => {
                const isSelected = selectedBg === bg.id
                return (
                  <Button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    title={bg.name}
                    variant="ghost"
                    size="icon-xs"
                    className={`min-w-0 min-h-0 w-6 h-6 rounded-full bg-gradient-to-br ${bg.class} border transition-all flex items-center justify-center cursor-pointer p-0 ${
                      isSelected
                        ? 'border-primary scale-110 shadow-md ring-2 ring-primary/40'
                        : 'border-white/10 hover:scale-105'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary font-black drop-shadow" />}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Watermark toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              {showWatermark ? (
                <Eye className="w-3.5 h-3.5 text-primary" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-semibold text-muted-foreground">
                {t('topsSettings.watermarkLabel', 'Firma')}
              </span>
              <Switch
                checked={showWatermark}
                onCheckedChange={setShowWatermark}
                size="sm"
                aria-label={t('topsSettings.watermarkLabel', 'Firma')}
              />
            </div>

            {showWatermark && (
              <Input
                type="text"
                placeholder={t('topsSettings.watermarkPlaceholder', 'Firma personalizada')}
                value={customWatermark}
                onChange={(e) => setCustomWatermark(e.target.value)}
                className="h-7 text-xs w-28 sm:w-36 bg-background/40 border-border/40 py-0.5 px-2"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export default TopsSettings;
