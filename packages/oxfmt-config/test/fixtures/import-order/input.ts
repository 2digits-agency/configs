import { helper } from '../helper';
import settings from './settings.json';
import { Button } from '@/components/Button';
import { something } from '@mod/utils';
import { thing } from '@2digits/constants';
import { clsx } from 'clsx';
import { NextResponse } from 'next/server';
import type { Config } from 'prettier';
import React from 'react';
import { readFile } from 'node:fs/promises';
import zebra from './zebra';

export function load(config:Config){return {Button,NextResponse,React,clsx,config,helper,readFile,settings,something,thing,zebra}}
