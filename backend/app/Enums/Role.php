<?php

namespace App\Enums;

enum Role: string
{
    case Writer = 'writer';
    case Director = 'director';
    case Producer = 'producer';
    case Admin = 'admin';
}
