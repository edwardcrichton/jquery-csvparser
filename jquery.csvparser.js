/*
* jQuery CSV parser
* Original author: https://github.com/edwardcrichton
* Licensed under the MIT license
*/

;(
function($)
{
	/* local functions */
	function parseCSV(context)
	{
		if(!context.csv)
		{
			return [];
		}
		
		var array=[];
		context.pos=0;
		for(;;)
		{
			var row=loadline(context);
			if(!row){break;}
			array.push(row);
		}
		
		return array;
	}
	
	function loadline(context)
	{
		var columns=[];
		
		for(var i=0;;i++)
		{
			if(i==0)
			{
				var gotRow=seekStart(context);
				if(!gotRow){break;}
			}
				
			var value=readField(context);
			if(value==null)
			{
				if(i==0)
				{
					// stop
					return null;
				}
				else
				{
					return columns;
				}
			}

			columns[i]=value;
			
		}
	}
	
	function isWhitespace(ch)
	{
		return (" \r\n\t\u000B\u000C\u001C\u001D\u001E\u001F\u2029".indexOf(ch)!=-1);
	}
	
	function trim(str)
    {
    	return str.replace(/^\s+|\s+$/g,"");
    }

	function seekStart(context)
	{
		for(;;)
		{
			if(context.pos>=context.csv.length)
			{
				// eof
				return false;
			}
			
			var c=context.csv.charAt(context.pos);
			if(isWhitespace(c)==false)
			{
				return true;
			}
			context.pos++;
		}
	}
	
	function readField(context)
	{
		for(;;)
		{
			if(context.pos>=context.csv.length)
			{
				// eof
				return null;
			}
		
			var c=context.csv.charAt(context.pos);
			if(c=='\n' || c=='\r')
			{
				return null;
			}
			if(isWhitespace(c)==false)
			{
				break;
			}
			context.pos++;
		}
		
		var inQuotes=false;
		
		if(context.pos>=context.csv.length)
		{
			// eof
			return null;
		}
		
		c=context.csv.charAt(context.pos++);
		
		if(c=='=')
		{
			// ms excel - skip it
			
			if(context.pos>=context.csv.length)
			{
				// eof
				return null;
			}

			c=context.csv.charAt(context.pos++);
		}
		
		if(c==context.quote)
		{
			inQuotes=true;
		}
		else
		{
			context.pos--;
		}
		
		var value="";
		
		for(;;)
		{
			if(context.pos>=context.csv.length)
			{
				// eof
				
				if(!inQuotes)
				{
					value=trim(value);
				}
				
				return value;
			}

			c=context.csv.charAt(context.pos++);
			
			
			if(inQuotes)
			{
				if(c==context.quote)
				{
					// look ahead for ""
					
					if(context.pos>=context.csv.length)
					{
						// end of field

						continue;
					}
					
					var d=context.csv.charAt(context.pos++);
					if(d==context.quote)
					{
						// an escaped quote
						value=value+context.quote;
					}
					else
					{
						// end of field - quote closed
						context.pos--;
						break;
					}
				}
			}
			
			if(!inQuotes)
			{
				if(c==context.quote)
				{
					// barf
					return null;
				}
				if(c=='\r' || c=='\n')
				{
					// hit end of line
					// rewind so that the next
					// call to readField will return null
					// to indicate the end of line
					context.pos--;
					break;
				}
				if(c==context.separator)
				{
					// hit end of field
					context.pos--;
					break;
				}
			}
		
			value=value+c;
		}
		
		if(!inQuotes)
		{
			value=trim(value);
		}
		
		if(value.length>=3)
		{
			if(value.charAt(0)=='=' && value.charAt(1)==context.quote && value.charAt(value.length-1)==context.quote )
			{
				// ms excel ="" that has been escaped
				value=value.substring(2,value.length-1);
			}
		}
		
		// move through whitespace and field separator
		
		for(;;)
		{
			if(context.pos>=context.csv.length)
			{
				break;
			}
		
			c=context.csv.charAt(context.pos++);
		
			if(c=='\n' || c=='\r')
			{
				context.pos--;
				break;
			}
			if(c==context.separator){break;}
			if(isWhitespace(c)==false)
			{
				context.pos--;
				break;
			}
		}
		
		return value;
	}
	
	// default options
	
	var defaults={separator:",", quote: '"'};

	// extend jQuery with the function getCSVParser(options) that
	// returns a csv parser function that takes the csv text as its parameter
	// and returns an array of arrays representing rows of columns.

	$.extend(
	{
		getCSVParser: function(options)
		{
			var context=$.extend({},defaults,options);
			
			return function(csv)
			{
				context.csv=csv;
				return parseCSV(context);
			};
		}
	
	
	}
	);
}
)(jQuery);
