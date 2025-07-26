'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Phone } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, format, differenceInCalendarDays } from "date-fns"
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker"
import { insuranceOptions } from '@/lib/data';
import type { Vehicle } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function VehicleBookingForm({ vehicle }: { vehicle: Vehicle }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string>(insuranceOptions[0].id);

  const selectedInsurance = insuranceOptions.find(opt => opt.id === selectedInsuranceId) || insuranceOptions[0];
  const rentalDays = date?.from && date?.to ? (differenceInCalendarDays(date.to, date.from) || 1) : 0;
  const vehicleTotal = rentalDays * vehicle.pricePerDay;
  const insuranceTotal = rentalDays * selectedInsurance.pricePerDay;
  const totalCost = vehicleTotal + insuranceTotal;

  return (
    <Card className="mt-8 bg-card border">
      <CardHeader>
        <CardTitle>Calcula tu Alquiler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Fechas de Alquiler</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-full justify-start text-left font-normal bg-background"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Cargando fechas...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={es}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium">Opciones de Seguro</Label>
          <RadioGroup value={selectedInsuranceId} onValueChange={setSelectedInsuranceId} className="mt-2 space-y-3">
            {insuranceOptions.map(opt => (
              <Label key={opt.id} className="flex items-start gap-3 rounded-md border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={opt.id} id={opt.id} />
                <div className="grid gap-1.5">
                  <div className="font-semibold flex justify-between items-center">
                    <span>{opt.title.es}</span>
                    <span className="text-primary">+${opt.pricePerDay.toFixed(2)}/día</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {opt.description.es}
                  </p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Costo del vehículo ({vehicle.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? 'día' : 'días'})</span>
            <span>${vehicleTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Costo del seguro ({selectedInsurance.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? 'día' : 'días'})</span>
            <span>${insuranceTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-xl mt-4 border-t pt-4">
            <span>Total Estimado</span>
            <span>${totalCost.toFixed(2)} USD</span>
          </div>
        </div>

        <Button size="lg" className="w-full text-lg h-12" asChild>
          <Link href="/#contact-section">
            <Phone className="mr-2 h-5 w-5" />
            Contactar para Reservar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
