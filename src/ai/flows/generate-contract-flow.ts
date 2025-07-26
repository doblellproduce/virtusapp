
'use server';

/**
 * @fileOverview A flow for generating a vehicle rental contract.
 *
 * - generateContract - Generates a contract based on reservation details.
 * - GenerateContractInput - The input type for the generateContract function.
 * - GenerateContractOutput - The return type for the generateContract function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateContractInputSchema = z.object({
  customerName: z.string().describe('The full name of the customer renting the vehicle.'),
  customerIdOrPassport: z.string().describe('The ID or Passport number of the customer.'),
  customerAddress: z.string().describe('The home address of the customer.'),
  vehicleDescription: z.string().describe('A description of the vehicle being rented (e.g., "Hyundai Accent 2023").'),
  vehiclePlate: z.string().describe('The license plate of the vehicle.'),
  pickupDate: z.string().describe('The pickup date for the rental in yyyy-MM-dd format.'),
  dropoffDate: z.string().describe('The drop-off date for the rental in yyyy-MM-dd format.'),
  totalCost: z.number().describe('The total cost of the rental in USD.'),
  deductible: z.number().describe('The insurance deductible amount in USD.'),
});
export type GenerateContractInput = z.infer<typeof GenerateContractInputSchema>;

export const GenerateContractOutputSchema = z.object({
  contractText: z.string().describe('The full rental agreement text.'),
});
export type GenerateContractOutput = z.infer<typeof GenerateContractOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateContractPrompt',
  input: {schema: GenerateContractInputSchema},
  output: {schema: GenerateContractOutputSchema},
  prompt: `
    Generate a formal vehicle rental agreement in Spanish for "Virtus Car Rental S.R.L.".
    The contract should be clear, concise, and professional.

    Use the following details to populate the contract:
    - Renter (Arrendatario): {{{customerName}}}
    - Renter's ID/Passport: {{{customerIdOrPassport}}}
    - Renter's Address: {{{customerAddress}}}
    - Vehicle (Vehículo): {{{vehicleDescription}}}
    - License Plate (Placa): {{{vehiclePlate}}}
    - Pickup Date (Fecha de Recogida): {{{pickupDate}}}
    - Drop-off Date (Fecha de Devolución): {{{dropoffDate}}}
    - Total Cost (Costo Total): \${{{totalCost}}} USD
    - Insurance Deductible (Deducible del Seguro): \${{{deductible}}} USD

    The contract should include the following clauses:
    1.  **Parties:** Clearly state "Virtus Car Rental S.R.L." as the Lessor (Arrendador) and the customer's details as the Lessee (Arrendatario).
    2.  **Object:** State the vehicle being rented.
    3.  **Term:** State the rental period from the pickup to the drop-off date.
    4.  **Payment:** State the total cost of the rental.
    5.  **Responsibilities of the Lessee:** Include points like returning the vehicle in the same condition, paying for fuel, not using the vehicle for illegal purposes, and being responsible for traffic violations.
    6.  **Insurance:** Mention the insurance coverage and the deductible amount.
    7.  **Signatures:** Leave space for both the Lessor and Lessee to sign.

    Format the entire output as a single block of text. Start with a clear title like "CONTRATO DE ALQUILER DE VEHÍCULO".
  `,
});

const generateContractFlow = ai.defineFlow(
  {
    name: 'generateContractFlow',
    inputSchema: GenerateContractInputSchema,
    outputSchema: GenerateContractOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateContract(input: GenerateContractInput): Promise<GenerateContractOutput> {
  return generateContractFlow(input);
}
