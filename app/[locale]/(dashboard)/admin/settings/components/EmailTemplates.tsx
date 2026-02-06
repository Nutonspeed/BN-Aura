'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EnvelopeSimple, PencilSimple, Eye } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  lastModified: string;
}

const defaultTemplates: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to BN-Aura!', description: 'Sent to new customers', lastModified: '2024-01-15' },
  { id: '2', name: 'Appointment Reminder', subject: 'Your Appointment Tomorrow', description: 'Reminder for upcoming appointments', lastModified: '2024-01-14' },
  { id: '3', name: 'Treatment Complete', subject: 'Treatment Summary', description: 'Sent after treatment completion', lastModified: '2024-01-13' },
];

export default function EmailTemplates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <EnvelopeSimple weight="duotone" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">Email Templates</h3>
            <p className="text-xs text-muted-foreground">Manage automated email communications</p>
          </div>
        </div>
        <Button size="sm" className="rounded-xl">
          <PencilSimple className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="space-y-4">
        {defaultTemplates.map((template) => (
          <Card key={template.id} className="p-4 rounded-2xl border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <EnvelopeSimple weight="duotone" className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <PencilSimple className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 rounded-2xl border-border/50 bg-secondary/20">
        <CardContent className="p-0">
          <p className="text-sm text-muted-foreground text-center">
            Email template editor is being enhanced with new features.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
