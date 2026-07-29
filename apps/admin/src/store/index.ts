import {configureStore} from '@reduxjs/toolkit'; import {adminApi} from './api';
export const store=configureStore({reducer:{[adminApi.reducerPath]:adminApi.reducer},middleware:g=>g().concat(adminApi.middleware)});
