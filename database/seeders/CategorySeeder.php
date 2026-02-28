<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Douane & Import/Export', 'color' => '#1d4ed8', 'order' => 1,
             'description' => 'Formulaires douaniers, déclarations, procédures d\'importation et d\'exportation'],
            ['name' => 'Transport & Logistique',  'color' => '#0891b2', 'order' => 2,
             'description' => 'Documents de transport, lettres de voiture, connaissements'],
            ['name' => 'Commerce International',  'color' => '#7c3aed', 'order' => 3,
             'description' => 'Contrats commerciaux, incoterms, factures pro-forma'],
            ['name' => 'Réglementation CEDEAO',   'color' => '#059669', 'order' => 4,
             'description' => 'Textes réglementaires, directives et protocoles CEDEAO'],
            ['name' => 'Formulaires Officiels',   'color' => '#d97706', 'order' => 5,
             'description' => 'Formulaires des administrations béninoises et régionales'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat['name']], $cat);
        }

        $this->command->info('✅ Catégories créées.');
    }
}
