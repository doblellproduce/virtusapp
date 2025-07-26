
'use server';

/**
 * @fileOverview A flow for generating a vehicle departure checklist.
 *
 * - generateDepartureChecklist - Generates a checklist based on inspection details.
 * - GenerateDepartureChecklistInput - The input type for the function.
 * - GenerateDepartureChecklistOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateDepartureChecklistInputSchema = z.object({
  customerName: z.string().describe('The full name of the customer.'),
  vehicleDescription: z.string().describe('A description of the vehicle (e.g., "Hyundai Accent 2023").'),
  vehiclePlate: z.string().describe('The license plate of the vehicle.'),
  pickupDate: z.string().describe('The pickup date in yyyy-MM-dd format.'),
  mileage: z.string().describe('The mileage of the vehicle at departure.'),
  fuelLevel: z.string().describe('The fuel level at departure (e.g., "Full", "3/4").'),
  notes: z.string().optional().describe('Any notes or observations about the vehicle\'s condition.'),
});
export type GenerateDepartureChecklistInput = z.infer<typeof GenerateDepartureChecklistInputSchema>;

export const GenerateDepartureChecklistOutputSchema = z.object({
  checklistText: z.string().describe('The formatted departure checklist text.'),
});
export type GenerateDepartureChecklistOutput = z.infer<typeof GenerateDepartureChecklistOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateDepartureChecklistPrompt',
  input: {schema: GenerateDepartureChecklistInputSchema},
  output: {schema: GenerateDepartureChecklistOutputSchema},
  prompt: `
    Generate a vehicle departure checklist in Spanish for "Virtus Car Rental S.R.L.".
    This document serves as proof of the vehicle's condition at the time of pickup.

    Use the following details:
    - Customer (Cliente): {{{customerName}}}
    - Vehicle (Vehículo): {{{vehicleDescription}}}
    - License Plate (Placa): {{{vehiclePlate}}}
    - Date (Fecha de Salida): {{{pickupDate}}}
    - Mileage (Kilometraje): {{{mileage}}} km
    - Fuel Level (Nivel de Combustible): {{{fuelLevel}}}
    - Notes (Observaciones): {{{notes}}}

    The checklist should be formatted clearly with a title "CHECKLIST DE SALIDA DE VEHÍCULO".
    List each detail with its corresponding value.
    Include a concluding paragraph stating that the customer accepts the vehicle in the condition described above.
    Leave space for the customer's signature.
  `,
});

const generateDepartureChecklistFlow = ai.defineFlow(
  {
    name: 'generateDepartureChecklistFlow',
    inputSchema: GenerateDepartureChecklistInputSchema,
    outputSchema: GenerateDepartureChecklistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateDepartureChecklist(input: GenerateDepartureChecklistInput): Promise<GenerateDepartureChecklistOutput> {
  return generateDepartureChecklistFlow(input);
}
