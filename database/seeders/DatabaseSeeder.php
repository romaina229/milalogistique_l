<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CategorySeeder::class);

        User::firstOrCreate(
            ['email' => 'milalogistique@gmail.com'],
            [
                'name'     => 'Milla Logistique Admin',
                'password' => Hash::make('Admin123!'),
                'phone'    => '+229 01 52 75 56 08',
                'is_admin' => true,
            ]
        );
        $this->command->info('Admin: milalogistique@gmail.com / Admin123!');

        $settings = [
            ['key' => 'site_name',        'value' => 'Milla Logistique'],
            ['key' => 'site_description', 'value' => 'Documents professionnels de logistique au Bénin'],
            ['key' => 'contact_email',    'value' => 'milalogistique@gmail.com'],
            ['key' => 'contact_phone',    'value' => '+229 01 52 75 56 08'],
            ['key' => 'download_expiry',  'value' => '72'],
            ['key' => 'currency',         'value' => 'FCFA'],
        ];
        foreach ($settings as $s) {
            Setting::firstOrCreate(['key' => $s['key']], ['value' => $s['value']]);
        }
    }
}
