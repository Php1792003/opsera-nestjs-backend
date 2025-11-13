import { Controller, Get, Render, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class ViewController {
  @Get('login')
  @Render('pages/login')
  getLoginPage(@Req() req: Request) {
    return { error: req.query.error };
  }

  @Get()
  redirectToIndex(@Res() res: Response) {
    return res.redirect('/index.html');
  }
}
