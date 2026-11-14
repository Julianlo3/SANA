import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express'; import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'; import { OriginGuard } from '../guards/origin.guard.js'; import { RolesGuard } from '../guards/roles.guard.js'; import { Roles } from '../middlewares/roles.decorator.js'; import { UserRole } from '../models/user-role.enum.js'; import { CarePackagesService } from './care-packages.service.js'; import { CloseCarePackageDto, CreateCarePackageDto, SchedulePackageAppointmentDto } from './dto/care-package.dto.js';
@Controller('care-packages') @UseGuards(OriginGuard,JwtAuthGuard,RolesGuard)
export class CarePackagesController { constructor(private readonly service:CarePackagesService) {}
 @Post() @Roles(UserRole.Secretary) create(@Body() dto:CreateCarePackageDto,@Req() r:Request&{user:any}){return this.service.create(dto,r.user.personId)}
 @Get() @Roles(UserRole.Secretary) findAll(){return this.service.findAll()}
 @Get(':id') @Roles(UserRole.Secretary,UserRole.Psychologist) find(@Param('id',ParseIntPipe) id:number){return this.service.find(id)}
 @Get(':id/availability') @Roles(UserRole.Requester) availability(@Param('id',ParseIntPipe) id:number,@Query() q:any,@Req() r:Request&{user:any}){return this.service.availability(id,r.user.personId,q)}
 @Post(':id/appointments') @Roles(UserRole.Secretary) schedule(@Param('id',ParseIntPipe) id:number,@Body() dto:SchedulePackageAppointmentDto,@Req() r:Request&{user:any}){return this.service.scheduleAppointment(id,dto,{secretaryId:r.user.personId})}
 @Post(':id/my-appointments') @Roles(UserRole.Requester) scheduleOwn(@Param('id',ParseIntPipe) id:number,@Body() dto:SchedulePackageAppointmentDto,@Req() r:Request&{user:any}){return this.service.scheduleAppointment(id,dto,{requesterId:r.user.personId})}
 @Patch(':id/finalize') @Roles(UserRole.Secretary) finalize(@Param('id',ParseIntPipe) id:number,@Body() dto:CloseCarePackageDto,@Req() r:Request&{user:any}){return this.service.close(id,'finalizado',dto,r.user.personId)}
 @Patch(':id/cancel') @Roles(UserRole.Secretary) cancel(@Param('id',ParseIntPipe) id:number,@Body() dto:CloseCarePackageDto,@Req() r:Request&{user:any}){return this.service.close(id,'cancelado',dto,r.user.personId)} }
