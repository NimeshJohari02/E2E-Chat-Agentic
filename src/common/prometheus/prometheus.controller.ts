import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusService } from './prometheus.service';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';

@ApiTags('Observability')
@Controller('metrics')
export class PrometheusController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiProduces('text/plain')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', this.prometheusService.getContentType());
    res.send(await this.prometheusService.getMetrics());
  }
}
