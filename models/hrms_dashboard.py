from datetime import timedelta, datetime, date
from dateutil.relativedelta import relativedelta
import pandas as pd
from odoo import models, fields, api, _
from odoo.http import request
from odoo.tools import float_utils


class crm(models.Model):
    _name = 'dashboard'

    # birthday = fields.Date('Date of Birth', groups="base.group_user")

    @api.model
    def get_premium(self):
        excepected_permum=0.0
        prob=0.0
        opp = self.env['crm.lead'].search([('active', '=', 1)])
        for rec in opp:
           excepected_permum+=rec.planned_revenue
           prob+= rec.probability
        res=prob/len(opp)
        return [excepected_permum,res]

    @api.model
    def get_gross(self):
        total = 0.0
        gross = 0.0
        policy = self.env['policy.broker'].search([])
        for rec in policy:
            total += rec.t_permimum
            gross += rec.gross_perimum
        return [total, gross]

    @api.model
    def get_commissions(self):
        total_commission = 0.0
        com_commission = 0.0
        policy = self.env['policy.broker'].search([])
        for rec in policy:
            total_commission += rec.total_brokerages
        return [total_commission, com_commission]

    @api.model
    def get_claim(self):
        totalsettled = 0.0
        total_paid_amount = 0.0
        claim = self.env['insurance.claim'].search([])
        for rec in claim:
            totalsettled += rec.totalsettled
            total_paid_amount += rec.total_paid_amount
        return [totalsettled, total_paid_amount]

    @api.model
    def get_No_agent(self):
        return len(self.env['res.partner'].search([('agent', '=', 1)])) if len(self.env['res.partner'].search([('agent', '=', 1)]))> 0 else 1

    @api.model
    def get_invoice(self):
        blue = 0.0
        green = 0.0
        inv = self.env['account.invoice'].search([])
        for rec in inv:
            blue += rec.amount_total_signed
            green += rec.residual_signed
        return [blue, green]

    @api.model
    def get_top_meeting(self):
        return self.env['calendar.event'].search_read([],order='start_datetime desc',limit=5,fields=["name","display_start"])
    @api.model
    def get_top_opp_policy_claim(self):
        #excepected_permum,claim_total,policy_total=0.0,0.0,0.0
        opp=self.env['crm.lead'].search_read([], order='date_deadline desc', limit=5 ,fields=["display_name","planned_revenue"])
        claim=self.env['insurance.claim'].search_read([], order='intimation_date desc', limit=5,fields=["insured", "lob", "insurer", "product", "customer_policy", "policy_number", "name", "totalclaimexp", "totalsettled", "total_paid_amount", "claimstatus"])
        pol = self.env['policy.broker'].search_read([], order='gross_perimum desc', limit=5,fields=["insurance_type", "line_of_bussines", "company", "product_policy", "customer", "std_id", "edit_number", "renwal_check", "issue_date", "start_date", "end_date", "gross_perimum", "t_permimum"])
        #for rec in opp:
         #  excepected_permum+=rec.planned_revenue
        #for rec in claim:
         #   claim_total+=rec.totalclaimexp
        #for rec in pol:
         #   policy_total+=rec.gross_perimum

        return {"opp":opp,"claim":claim,"pol":pol}

    @api.model
    def get_No_leads(self):
        date=datetime.today().strftime('%Y-%m')
        return [len(self.env['crm.lead'].search([('type','=','lead')]))]

    @api.model
    def get_leads_ratio(self):

        current_month = datetime.today().strftime('%Y-%m')
        set_date = datetime.strptime(current_month,'%Y-%m').date()
        prev_month = set_date-relativedelta(months=1)
        month=prev_month.strftime('%Y-%m')

        lead_curent=len(self.env['crm.lead'].search([('type', '=', 'lead'),('create_date','ilike',current_month)]))
        lead_prev = len(self.env['crm.lead'].search([('type', '=', 'lead'), ('create_date', 'ilike', month)]))
        if lead_prev==0:
            return [100]
        else:
           return [((lead_curent-lead_prev)/(lead_prev))*100]


    @api.model
    def get_drop_avg(self):
        return[(self.get_No_leads()[0]/self.get_No_agent())]


    def _cal_stage_data(self,planned,count):
        agent=self.get_No_agent()
        if(count==0):
            count=1
        if(agent==0):
            agent=1
        return [planned,count,(planned/count),(planned/agent),(count/agent)]

    @api.model
    def get_new_opp(self):
        opp_new = self.env['crm.lead'].search([('active', '=', 1),('stage_id','=','New')])
        total_palnned=0.0
        for rec in opp_new:
            total_palnned+=rec.planned_revenue
        print(len(opp_new))
        return self._cal_stage_data(total_palnned,len(opp_new))

    @api.model
    def get_new_ratio(self,stage_id):
        domain=[]
        if stage_id == "Lost":
           domain= ('active', '!=', 1)
        else:
            domain=('active', '=', 1)
        current_month = datetime.today().strftime('%Y-%m')
        set_date = datetime.strptime(current_month, '%Y-%m').date()
        prev_month = set_date - relativedelta(months=1)
        month = prev_month.strftime('%Y-%m')
        new_curent = self.env['crm.lead'].search([domain, ('stage_id', '=', stage_id), ('create_date', 'ilike', current_month)])
        total_palnned = 0.0
        for rec in new_curent:
            total_palnned += rec.planned_revenue
        new_prev = self.env['crm.lead'].search([('active', '=', 1), ('stage_id', '=', 'New'), ('create_date', 'ilike', month)])
        total_palnned_prev = 0.0
        for rec in new_prev:
            total_palnned_prev += rec.planned_revenue
        if total_palnned_prev == 0:
            print(total_palnned , total_palnned_prev)
            return [100]
        else:
            return [((total_palnned - total_palnned_prev) / (total_palnned_prev)) * 100]

    @api.model
    def get_qualified_opp(self):
        opp = self.env['crm.lead'].search([('active', '=', 1), ('stage_id', '=', 'Qualified')])
        total_palnned = 0.0
        for rec in opp:
            total_palnned += rec.planned_revenue
        return self._cal_stage_data(total_palnned, len(opp))

    @api.model
    def get_proposition_opp(self):
        opp = self.env['crm.lead'].search([('active', '=', 1), ('stage_id', '=', 'Proposition')])
        total_palnned = 0.0
        for rec in opp:
            total_palnned += rec.planned_revenue
        return self._cal_stage_data(total_palnned, len(opp))

    @api.model
    def get_lost_opp(self):
        opp = self.env['crm.lead'].search([('active', '=', 0)])
        total_palnned = 0.0
        for rec in opp:
            total_palnned += rec.planned_revenue
        return self._cal_stage_data(total_palnned, len(opp))

    @api.model
    def get_won_opp(self):
        opp = self.env['crm.lead'].search([('active', '=', 1), ('stage_id', '=', 'Won')])
        total_palnned = 0.0
        for rec in opp:
            total_palnned += rec.planned_revenue
        return self._cal_stage_data(total_palnned, len(opp))

    @api.model
    def target_graph(self):
        current_year = datetime.today().strftime('%Y')
        current_date = datetime.today()
        d = datetime(int(current_year), 1,1)
        res=[]
        total=0.0
        while d<=current_date:  
            setdate=datetime.strftime(d,'%Y-%m')
            policy = self.env['policy.broker'].search([('issue_date','ilike',setdate)])
            for rec in policy:
                total += rec.t_permimum
            res.append(total)
            # set_date = datetime.strptime(d, '%Y-%m').date()
            d=d+relativedelta(months=1)
        return res

    @api.model
    def get_line_policy(self):
        line= self.env['insurance.line.business'].search([])
        policy = self.env['policy.broker'].search([])
        print(policy)
        total=0.0
        res=[]
        for rec in policy:
            total += rec.t_permimum
        for rec in line:
            pol = self.env['policy.broker'].search([('line_of_bussines', '=', rec.id)])
            print(pol)
            total_line = 0.0
            for rec2 in pol:
                total_line += rec2.t_permimum
            res.append({"lob":rec.display_name,"perc":(total_line / total) * 100}) 
        return res

    @api.model
    def get_insurer_policy(self):
        insurer = self.env['res.partner'].search([('insurer_type','=',1)])
        policy = self.env['policy.broker'].search([])
        print(policy)
        res = []
        for ins in insurer:
            pol = self.env['policy.broker'].search([('company', '=', ins.id)])
            print(pol)
            total_line = 0.0
            for rec in pol:
                total_line += rec.t_permimum
            res.append({"total":total_line,"name":ins.name})
        return res

    @api.model
    def get_dashboard(self):

        return{
            "comBrok":self.get_commissions(),
            'NewRatio':self.get_new_ratio('New'),
            'QualifiedRatio':self.get_new_ratio('Qualified'),
            'PropositionRatio':self.get_new_ratio('Proposition'),
            'WonRatio':self.get_new_ratio('Won'),
            'LostRatio':self.get_new_ratio('Lost'),
            'ExpectedPrem':self.get_premium(),
            'Gross/Net':self.get_gross(),
            'claim':self.get_claim(),
            'Agent':self.get_No_agent(),
            'TotalSigned':self.get_invoice(),
            'Meeting':self.get_top_meeting(),
            'GetTop':self.get_top_opp_policy_claim(),
            'Leads':self.get_No_leads(),
            'LeadsRatio':self.get_leads_ratio(),
            'DropAvg':self.get_drop_avg(),
            'New':self.get_new_opp(),
            'Qualified':self.get_qualified_opp(),
            'Proposition':self.get_proposition_opp(),
            'Won':self.get_won_opp(),
            'Lost':self.get_lost_opp(),
            'TargetGraph':self.target_graph(),
            'InsurerGraph':self.get_insurer_policy(),
            'Lob':self.get_line_policy()
        }
    # @api.model
    # def get_qualified_opp(self):
    #     policy = self.env['policy.broker'].search([('issue_date', 'ilike', setdate)])
    #     total_palnned = 0.0
    #     for rec in opp:
    #         total_palnned += rec.planned_revenue
    #         return self._cal_stage_data(total_palnned, len(opp))




        # set_date = datetime.strptime(current_month, '%Y-%m').date()
        # prev_month = set_date - relativedelta(months=1)
        # month = prev_month.strftime('%Y-%m')
        #
        # lead_curent = len(self.env['crm.lead'].search([('type', '=', 'lead'), ('create_date', 'ilike', current_month)]))
        # lead_prev = len(self.env['crm.lead'].search([('type', '=', 'lead'), ('create_date', 'ilike', month)]))
        # if lead_prev == 0:
        #     return [100]
        # else:







# class policy(models.Model):
#     _inherit = 'policy.broker'
#
#     # birthday = fields.Date('Date of Birth', groups="base.group_user")
#
#     @api.model
#     def get_gross(self):
#         total=0.0
#         gross=0.0
#         policy= self.env['policy.broker'].search([])
#         for rec in policy:
#             total+=rec.t_permimum
#             gross+= rec.gross_perimum
#         return [total,gross]
#
#     @api.model
#     def get_claim(self):
#         totalsettled = 0.0
#         total_paid_amount = 0.0
#         claim = self.env['insurance.claim'].search([])
#         for rec in claim:
#             totalsettled += rec.totalsettled
#             total_paid_amount += rec.total_paid_amount
#         return [totalsettled, total_paid_amount]

# class claim(models.Model):
#     _inherit = 'insurance.claim'
#
#     # birthday = fields.Date('Date of Birth', groups="base.group_user")
#
#     @api.model
#     def get_claim(self):
#         totalsettled=0.0
#         total_paid_amount=0.0
#         claim= self.env['insurance.claim'].search([])
#         for rec in claim:
#             totalsettled+=rec.totalsettled
#             total_paid_amount+= rec.total_paid_amount
#         return [totalsettled,total_paid_amount]

