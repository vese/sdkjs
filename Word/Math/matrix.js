"use strict";

var MATH_MC_JC = MCJC_CENTER;


function CMathMatrix(props)
{
	this.Id = g_oIdCounter.Get_NewId();
    this.kind = MATH_MATRIX;

    this.gaps = null;

    this.Pr =
    {
        cGp:        0,
        cGpRule:    0,
        cSp:        0,

        rSp:        0,
        rSpRule:    0,

        mcJc:       new Array(),
        baseJc:     BASEJC_CENTER,
        plcHide:    false
    };

    this.spaceRow =
    {
        rule: 0,
        gap: 0,
        minGap: 13/12    // em
                         // 780 /20 (pt) for font 36 pt
                         // minGap: 0
    };
    this.spaceColumn =
    {
        rule: 0,
        gap: 0,
        minGap: 0       // minGap / 20 pt
    };

    this.gaps =
    {
        row: [],
        column: []
    };

    ////  special for "read"  ////
    this.row = 0;
    this.column = 0;
    ////

    CMathMatrix.superclass.constructor.call(this);

    if(props !== null && typeof(props) !== "undefined")
        this.init(props);
        //this.constructor.superclass.init.call(this, props);

	g_oTableId.Add( this, this.Id );
}
extend(CMathMatrix, CMathBase);
CMathMatrix.prototype.init = function(props)
{
    this.setProperties(props);
    this.fillContent();
}
CMathMatrix.prototype.setRuleGap = function(oSpace, rule, gap, minGap)
{
    var bInt  =  rule == rule - 0 && rule == rule^ 0,
        bRule =  rule >= 0 && rule <= 4;

    if(bInt && bRule)
        oSpace.rule = rule;
    else
        oSpace.rule = 0;


    if(gap == gap - 0 && gap == gap^0)
        oSpace.gap = gap;
    else
        oSpace.gap = 0;

    if(minGap == minGap - 0 && minGap == minGap^0)
        oSpace.minGap = gap;
}
CMathMatrix.prototype.recalculateSize = function(oMeasure)
{
    if(this.RecalcInfo.bProps)
    {
        this.setRuleGap(this.spaceColumn, this.Pr.cGpRule, this.Pr.cGp, this.Pr.cSp);
        this.setRuleGap(this.spaceRow, this.Pr.rSpRule, this.Pr.rSp);

        for(var j = 0; j < this.nCol; j++)
            this.alignment.wdt[j] = this.Pr.mcJc[j];

        if(this.Pr.plcHide)
            this.hidePlaceholder(true);

        this.RecalcInfo.bProps = false;
    }


    var txtPrp = this.Get_CompiledCtrPrp();

    var intervalCol = this.getLineGap(txtPrp);
    this.gaps.column[0] = 0;
    for(var i = 0; i < this.nCol - 1; i++)
        this.gaps.column[i + 1] = intervalCol;

    var intervalRow = this.getRowSpace(txtPrp);

    var divCenter = 0;
    var metrics = this.getMetrics();

    var plH = 0.2743827160493827 * txtPrp.FontSize;
    var minGp = this.spaceRow.minGap*txtPrp.FontSize*g_dKoef_pt_to_mm;
    minGp -= plH;
    this.gaps.row[0] = 0;
    for(var j = 0; j < this.nRow - 1; j++)
    {
        divCenter = intervalRow - (metrics.descents[j] + metrics.ascents[j + 1]);
        this.gaps.row[j + 1] = minGp > divCenter ? minGp : divCenter;
    }

    var height = 0, width = 0;

    for(var i = 0; i< this.nCol; i++)
        width +=  this.gaps.column[i] + metrics.widths[i];

    for(var j = 0; j < this.nRow; j++)
        height += this.gaps.row[j] + metrics.ascents[j] + metrics.descents[j];

    var ascent = 0;

    if(this.Pr.baseJc == BASEJC_TOP)
    {
        for(var j = 0; j < this.nCol; j++)
            ascent = this.elements[0][j].size.ascent > ascent ? this.elements[0][j].size.ascent : ascent;
    }
    else if(this.Pr.baseJc == BASEJC_BOTTOM)
    {
        var descent = 0,
            currDsc;
        for(var j = 0; j < this.nCol; j++)
        {
            currDsc = this.elements[this.nRow -1][j].size.height - this.elements[this.nRow -1][j].size.ascent;
            descent = currDsc > descent ? currDsc : descent;

            ascent = height - descent;
        }
    }
    else /*this.Pr.baseJc == 0*/
        ascent = this.getAscent(oMeasure, height);


    //width += this.GapLeft + this.GapRight;

    this.size = {width: width, height: height, ascent: ascent};
}
CMathMatrix.prototype.setPosition = function(pos)
{
    this.pos.x = pos.x;

    if(this.bMObjs === true)
        this.pos.y = pos.y;
    else
        this.pos.y = pos.y - this.size.ascent; ///!!!!

    var maxWH = this.getWidthsHeights();
    var Widths = maxWH.widths;
    var Heights = maxWH.heights;

    var NewPos = new CMathPosition();

    var h = 0, w = 0;

    for(var i=0; i < this.nRow; i++)
    {
        w = 0;
        for(var j = 0; j < this.nCol; j++)
        {
            var al = this.align(i, j);
            NewPos.x = this.pos.x + this.GapLeft + al.x + this.gaps.column[j] + w;
            NewPos.y = this.pos.y + al.y + this.gaps.row[i] + h;

            this.elements[i][j].setPosition(NewPos);
            w += Widths[j] + this.gaps.column[j];
        }
        h += Heights[i] + this.gaps.row[i];
    }

}
CMathMatrix.prototype.findDisposition = function( coord )
{
    var mouseCoord = {x: null, y: null},
        posCurs =    {x: this.nRow - 1, y: this.nCol - 1};

    var maxWH = this.getWidthsHeights();
    var Widths = maxWH.widths;
    var Heights = maxWH.heights;

    for(var i = 0, w = 0; i < this.nCol; i++)
    {
        w += Widths[i] + this.gaps.column[i + 1]/2;
        if(coord.x < w)
        {
            posCurs.y = i;
            break;
        }
        w += this.gaps.column[i + 1]/2;
    }

    for(var j = 0, h = 0; j < this.nRow; j++)
    {
        h += Heights[j] + this.gaps.row[j + 1]/2;
        if(coord.y < h)
        {
            posCurs.x = j;
            break;
        }
        h += this.gaps.row[j + 1]/2;
    }

    ////////////////////////////////

    var sumWidth = 0;
    var sumHeight = 0;

    for(var t = 0; t < posCurs.y; t++)
        sumWidth += Widths[t] + this.gaps.column[t + 1];
    for(t = 0; t < posCurs.x; t++)
        sumHeight += Heights[t] + this.gaps.row[t + 1];

    // флаг для случая, когда выходим за границы элемента и есть выравнивание относительно других элементов
    var inside_flag = -1;

    if( posCurs.x != null && posCurs.y != null)
    {
        var size = this.elements[posCurs.x][posCurs.y].size;
        var align = this.align(posCurs.x, posCurs.y);
        if(coord.x < ( sumWidth + align.x ))
        {
            mouseCoord.x = 0;
            inside_flag = 0;
        }
        else if( coord.x > (sumWidth + align.x + size.width ))
        {
            mouseCoord.x = size.width;
            inside_flag = 1;
        }
        else
            mouseCoord.x = coord.x - ( sumWidth + align.x );

        if(coord.y < (sumHeight + align.y))
        {
            mouseCoord.y = 0;
            inside_flag = 2;
        }
        else if( coord.y > ( sumHeight + align.y + size.height ) )
        {
            mouseCoord.y = size.height;
            inside_flag = 2;
        }
        else
            mouseCoord.y = coord.y - ( sumHeight + align.y );
    }

    return {pos: posCurs, mCoord: mouseCoord, inside_flag: inside_flag};
}
CMathMatrix.prototype.getMetrics = function()
{
    var Ascents = [];
    var Descents = [];
    var Widths = [];

    for(tt = 0; tt < this.nRow; tt++ )
    {
        Ascents[tt] = 0;
        Descents[tt] = 0;
    }
    for(var tt = 0; tt < this.nCol; tt++ )
        Widths[tt] = 0;

    for(var i=0; i < this.nRow; i++)
        for(var j = 0; j < this.nCol ; j++)
        {
            var size = this.elements[i][j].size;
            Widths[j] = ( Widths[j] > size.width ) ? Widths[j] : size.width;
            Ascents[i] = (Ascents[i] > size.ascent ) ? Ascents[i] : size.ascent;
            Descents[i] = (Descents[i] > size.height - size.ascent ) ? Descents[i] : size.height - size.ascent;
        }

    return {ascents: Ascents, descents: Descents, widths: Widths}
}
CMathMatrix.prototype.findDistance = function() // для получения позиции тагета
{
    var w = 0, h = 0;
    //кол-во элементов gap равно кол-ву элементов в строке/столбце для удобства подсчета
    for(var i = 0; i <= this.CurPos_X; i++)
        w += this.gaps.column[i];

    for(var j = 0; j <= this.CurPos_Y; j++)
        h += this.gaps.row[j];

    return {w : w, h: h };
}
CMathMatrix.prototype.addRow = function()
{
    this.nRow++;

    for(var j = 0; j < this.nCol; j++)
    {
        this.elements[this.nRow-1][j] = new CMathContent();
        //this.elements[this.nRow-1][j].relate(this);
        //this.elements[this.nRow-1][j].setComposition(this.Composition);
    }

    // не будет работать, т.к. нужен для пересчета oMeasure
    this.recalculateSize();
}
CMathMatrix.prototype.setRowGapRule = function(rule, gap)
{
    this.spaceRow.rule = rule;
    this.spaceRow.gap = gap;
}
CMathMatrix.prototype.setColumnGapRule = function(rule, gap, minGap)
{
    this.spaceColumn.rule = rule;
    this.spaceColumn.gap = gap;
    if(minGap !== null && typeof(minGap) !== "undefined")
        this.spaceColumn.minGap = minGap;
}
CMathMatrix.prototype.getLineGap = function(txtPrp)
{
    var spLine;

    if(this.spaceColumn.rule == 0)
        spLine = 1;             //em
    else if(this.spaceColumn.rule == 1)
        spLine = 1.5;           //em
    else if(this.spaceColumn.rule == 2)
        spLine = 2;             //em
    else if(this.spaceColumn.rule == 3)
        spLine = this.spaceColumn.gap/20;  //pt
    else if(this.spaceColumn.rule == 4)
        spLine = this.spaceColumn.gap/2;   //em
    else
        spLine = 1;

    var lineGap;

    if(this.spaceColumn.rule == 3)
        lineGap = spLine*g_dKoef_pt_to_mm;                           //pt
    else
        lineGap = spLine*txtPrp.FontSize*g_dKoef_pt_to_mm;           //em

    var wPlh = 0.3241834852430555 * txtPrp.FontSize;

    var min = this.spaceColumn.minGap / 20 * g_dKoef_pt_to_mm - wPlh;
    lineGap = Math.max(lineGap, min);
    //lineGap += this.params.font.metrics.Placeholder.Height; // для случая, когда gapRow - (аскент + дескент) > minGap, вычитаем из gap строки, а здесь прибавляем стандартный metrics.Height

    return lineGap;
}
CMathMatrix.prototype.getRowSpace = function(txtPrp)
{
    var spLine;

    if(this.spaceRow.rule == 0)
        spLine = 7/6;                 //em
    else if(this.spaceRow.rule == 1)
        spLine = 7/6 *1.5;            //em
    else if(this.spaceRow.rule == 2)
        spLine = 7/6 *2;              //em
    else if(this.spaceRow.rule == 3)
        spLine = this.spaceRow.gap/20;         //pt
    else if(this.spaceRow.rule == 4)
        spLine = 7/6 * this.spaceRow.gap/2;    //em
    else
        spLine = 7/6;

    var lineGap;

    if(this.spaceRow.rule == 3)
        lineGap = spLine*g_dKoef_pt_to_mm;                           //pt
    else
        lineGap = spLine*txtPrp.FontSize*g_dKoef_pt_to_mm; //em


    var min = this.spaceRow.minGap*txtPrp.FontSize*g_dKoef_pt_to_mm;
    lineGap = Math.max(lineGap, min);

    return lineGap;
}
CMathMatrix.prototype.baseJustification = function(type)
{
    this.Pr.baseJc = type;
}
////
CMathMatrix.prototype.setProperties = function(props)
{
    this.setCtrPrp(props.ctrPrp);

    if(typeof(props.row) !== "undefined" || props.row !== null)
        this.nRow = props.row;

    if(typeof(props.column) !== "undefined" || props.column !== null)
        this.nCol = props.column;

    if(props.plcHide === true || props.plcHide === 1)
        this.Pr.plcHide = true;

    if(props.baseJc === BASEJC_CENTER || props.baseJc === BASEJC_TOP || props.baseJc === BASEJC_BOTTOM)
        this.Pr.baseJc = props.baseJc;


    if(props.mcJc.constructor.name == "Array" && props.mcJc.length == props.column)
    {
        for(var i = 0; i < this.nCol; i++)
        {
            if(props.mcJc[i] == MCJC_LEFT || props.mcJc[i] == MCJC_RIGHT || props.mcJc[i] == MCJC_CENTER)
                this.Pr.mcJc[i] = props.mcJc[i];
            else
                this.Pr.mcJc[i] = MCJC_CENTER;
        }
    }
    else
    {
        for(var j = 0; j < this.nCol; j++)
            this.Pr.mcJc[j] = MCJC_CENTER;
    }


    this.Pr.cGpRule = props.cGpRule;
    this.Pr.cGp     = props.cGp;
    this.Pr.cSp     = props.cSp;

    this.Pr.rSpRule = props.rSpRule;
    this.Pr.rSp     = props.rSp;
}
CMathMatrix.prototype.fillContent = function()
{
    if(this.nRow == 0)
        this.nRow = 1;

    if(this.nCol == 0)
        this.nCol = 1;

    this.setDimension(this.nRow, this.nCol);
    this.setContent();
}
CMathMatrix.prototype.fillMathComposition = function(props, contents /*array*/)
{
    this.setProperties(props);
    this.fillContent();

    for(var i = 0; i < this.nRow; i++)
        for(var j = 0; j < this.nCol; j++)
            this.elements[i][j] = contents[j + i*this.nCol];

}
CMathMatrix.prototype.getPropsForWrite = function()
{
    var props = {};

    props.baseJc  = this.Pr.baseJc;
    props.row     = this.Pr.nRow;
    props.column  = this.Pr.nCol;
    props.plcHide = this.Pr.plcHide;

    props.cGpRule = this.spaceColumn.rule;
    props.cGp     = this.spaceColumn.gap;
    props.cSp     = this.spaceColumn.minGap;

    props.rSpRule = this.spaceRow.rule;
    props.rSp     = this.spaceRow.gap;

    return props;
}
CMathMatrix.prototype.Save_Changes = function(Data, Writer)
{
	Writer.WriteLong( historyitem_type_matrix );
}
CMathMatrix.prototype.Load_Changes = function(Reader)
{
}
CMathMatrix.prototype.Refresh_RecalcData = function(Data)
{
}
CMathMatrix.prototype.Write_ToBinary2 = function( Writer )
{	
	Writer.WriteLong( historyitem_type_matrix );

	Writer.WriteLong( this.nRow );
	Writer.WriteLong( this.nCol );
	for(var i=0; i<this.nRow; i++)
		for(var j=0; j<this.nCol; j++)
			Writer.WriteString2( this.getElement(i,j).Id );
	
	this.CtrPrp.Write_ToBinary(Writer);
	
	var StartPos = Writer.GetCurPosition();
    Writer.Skip(4);
    var Flags = 0;
	if ( undefined != this.Pr.baseJc )
    {
		Writer.WriteLong( this.Pr.baseJc );
		Flags |= 1;
	}
	if ( undefined != this.Pr.cGp )
    {
		Writer.WriteLong( this.Pr.cGp );
		Flags |= 2;
	}
	if ( undefined != this.Pr.cGpRule )
    {
		Writer.WriteLong( this.Pr.cGpRule );
		Flags |= 4;
	}
	if ( undefined != this.Pr.cSp )
    {
		Writer.WriteLong( this.Pr.cSp );
		Flags |= 8;
	}
	if ( undefined != this.Pr.mcs )
    {
		Writer.WriteLong( this.Pr.mcs );
		Flags |= 16;
	}
	if ( undefined != this.Pr.plcHide )
    {
		Writer.WriteBool( this.Pr.plcHide );
		Flags |= 32;
	}
	if ( undefined != this.Pr.rSp )
    {
		Writer.WriteLong( this.Pr.rSp );
		Flags |= 64;
	}
	if ( undefined != this.Pr.rSpRule )
    {
		Writer.WriteLong( this.Pr.rSpRule );
		Flags |= 128;
	}
	var EndPos = Writer.GetCurPosition();
    Writer.Seek( StartPos );
    Writer.WriteLong( Flags );
    Writer.Seek( EndPos );
}
CMathMatrix.prototype.Read_FromBinary2 = function( Reader )
{
	var props = {ctrPrp: new CTextPr()};
	var arrElems = [];
	
	props.row = Reader.GetLong();
	props.col = Reader.GetLong();
	for(var i=0; i<props.row; i++)
		for(var j=0; j<props.col; j++)
			arrElems.push(g_oTableId.Get_ById( Reader.GetString2()));
	
	props.ctrPrp.Read_FromBinary(Reader);
	
	var Flags = Reader.GetLong();
	if ( Flags & 1 )
		props.baseJc = Reader.GetLong();
	if ( Flags & 2 )
		props.cGp = Reader.GetLong();
	if ( Flags & 4 )
		props.cGpRule = Reader.GetLong();
	if ( Flags & 8 )
		props.cSp = Reader.GetLong();
	if ( Flags & 16 )
		props.mcs = Reader.GetLong();
	if ( Flags & 32 )
		props.plcHide = Reader.GetBool();
	if ( Flags & 64 )
		props.rSp = Reader.GetLong();
	if ( Flags & 128 )
		props.rSpRule = Reader.GetLong()
		
	this.fillMathComposition (props, arrElems);
}
CMathMatrix.prototype.Get_Id = function()
{
	return this.Id;
}

////
function CEqArray(props)
{
	this.Id = g_oIdCounter.Get_NewId();
    this.kind = MATH_EQ_ARRAY;

    this.maxDist = 0;
    this.objDist = 0;

    this.init_2(props);
	g_oTableId.Add( this, this.Id );
}
extend(CEqArray, CMathMatrix);
CEqArray.prototype.init_2 = function(props)
{
    var Pr =
    {
        column:     1,
        row:        props.row,
        baseJc:     BASEJC_CENTER,
        rSpRule:    0,
        rSp:        0,
        maxDist:    0,
        objDist:    0,
        ctrPrp:     new CTextPr()

    }; // default


    if(props.rSpRule !== "undefined" && props.rSpRule !== null)
        Pr.rSpRule = props.rSpRule;

    if(props.rSp !== "undefined" && props.rSp !== null)
        Pr.rSp = props.rSp;

    if(props.baseJc !== "undefined" && props.baseJc !== null)
        Pr.baseJc = props.baseJc;

    if(props.maxDist !== "undefined" && props.maxDist !== null)
        this.maxDist = props.maxDist;

    if(props.objDist !== "undefined" && props.objDist !== null)
        this.objDist = props.objDist;

    if(props.ctrPrp !== "undefined" && props.ctrPrp !== null)
        Pr.ctrPrp = props.ctrPrp;


    CEqArray.superclass.constructor.call(this, Pr);
}
CEqArray.prototype.getElement = function(num)
{
    return this.elements[num][0];
}
CEqArray.prototype.fillMathComposition = function(props, contents /*array*/)
{
    this.setProperties(props);
    this.fillContent();

    for(var i = 0; i < this.nRow; i++)
        this.elements[i][0] = contents[i];
}
CEqArray.prototype.getPropsForWrite = function()
{
    var props = {};

    props.row     = this.nRow;
    props.baseJc  = this.baseJc;

    props.rSpRule = this.spaceRow.rule;
    props.rSp     = this.spaceRow.gap;
    props.maxDist = this.maxDist;
    props.objDist = this.objDist;

    return props;
}
CEqArray.prototype.Save_Changes = function(Data, Writer)
{
	Writer.WriteLong( historyitem_type_eqArr );
}
CEqArray.prototype.Load_Changes = function(Reader)
{
}
CEqArray.prototype.Refresh_RecalcData = function(Data)
{
}
CEqArray.prototype.Write_ToBinary2 = function( Writer )
{	
	Writer.WriteLong( historyitem_type_eqArr );
	
	var row = this.elements.length;
	Writer.WriteLong( row );
	for(var i=0; i<row; i++)
		Writer.WriteString2( this.getElement(i).Id );
	
	this.CtrPrp.Write_ToBinary(Writer);
	
	var StartPos = Writer.GetCurPosition();
    Writer.Skip(4);
    var Flags = 0;
	if ( undefined != this.Pr.baseJc )
    {
		Writer.WriteLong( this.Pr.baseJc );	
		Flags |= 1;
	}
	if ( undefined != this.Pr.maxDist )
    {
		Writer.WriteBool( this.Pr.maxDist );	
		Flags |= 2;
	}
	if ( undefined != this.Pr.objDist )
    {
		Writer.WriteBool( this.Pr.objDist );	
		Flags |= 4;
	}
	if ( undefined != this.Pr.rSp )
    {
		Writer.WriteLong( this.Pr.rSp );	
		Flags |= 8;
	}
	if ( undefined != this.Pr.rSpRule )
    {
		Writer.WriteLong( this.Pr.rSpRule );
		Flags |= 16;
	}
	var EndPos = Writer.GetCurPosition();
    Writer.Seek( StartPos );
    Writer.WriteLong( Flags );
    Writer.Seek( EndPos );
}
CEqArray.prototype.Read_FromBinary2 = function( Reader )
{
	var props = {ctrPrp: new CTextPr()};
	var arrElems = [];
	
	props.row = Reader.GetLong();
	for(var i=0; i<props.row; i++)
		arrElems.push(g_oTableId.Get_ById( Reader.GetString2()));
	
	props.ctrPrp.Read_FromBinary(Reader);
	
	var Flags = Reader.GetLong();
	if ( Flags & 1 )
		props.baseJc = Reader.GetLong();
	if ( Flags & 2 )
		props.maxDist = Reader.GetBool();
	if ( Flags & 4 )
		props.objDist = Reader.GetBool();
	if ( Flags & 8 )
		props.rSp = Reader.GetLong();
	if ( Flags & 16 )
		props.rSpRule = Reader.GetLong();
		
	this.fillMathComposition (props, arrElems);
}
CEqArray.prototype.Get_Id = function()
{
	return this.Id;
}

function TEST_MATH_JUCTIFICATION(mcJc)
{
    MATH_MC_JC = mcJc;

    editor.WordControl.m_oLogicDocument.Content[0].Content[0].Root.Resize(null, editor.WordControl.m_oLogicDocument.Content[0].Content[0] , g_oTextMeasurer);

    var pos = new CMathPosition();
    pos.x = 0;
    pos.y = 0;
    editor.WordControl.m_oLogicDocument.Content[0].Content[0].Root.setPosition(pos);

    editor.WordControl.m_oLogicDocument.DrawingDocument.ClearCachePages();
    editor.WordControl.m_oLogicDocument.DrawingDocument.FirePaint();
}